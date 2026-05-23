import { promises as fs } from 'fs'
import path from 'path'
import chalk from 'chalk'
import { generateObject } from 'ai'
import { z } from 'zod'

const ApplicationSchema = z.object({
  folderName: z.string().describe("Star-Case folder name for the application"),
  description: z.string().describe("Brief description of what was created"),
  files: z.array(
    z.object({
      path: z.string().describe("Relative file path (ex: src/App.jsx)"),
      content: z.string().describe("Complete File Content")
    }).describe("All files needed for the application")
  ),
  setupCommands: z.array(
    z.string().describe("Bash commands to setup and run (ex: npm install, npm run dev)")
  )
})

function printSystem(message){
  console.log(message)
}

function displayFileTree(files, folderName){
  printSystem(chalk.cyan("\n📂 Project Structure:"))
  printSystem(chalk.white(`${folderName}/`))

  const filesByDir = {}
  files.forEach(file => {
    const parts = file.path.split("/")
    const dir = parts.length > 1 ? parts.slice(0,-1).join("/") : ""

    if(!filesByDir[dir]){
      filesByDir[dir] = []
    }

    filesByDir[dir].push(parts[parts.length - 1])
  })

  Object.keys(filesByDir).sort().forEach(dir => {
    if(dir) {
      printSystem(chalk.white(`├── ${dir}/`))
      filesByDir[dir].forEach(file => {
        printSystem(chalk.white(`│  └── ${file}`))
      })
    }
    else {
      filesByDir[dir].forEach(file => {
        printSystem(chalk.white(`├── ${file}`))
      })
    }
  })
}

async function createApplicationFiles(baseDir, folderName, files){
  const appDir = path.join(baseDir, folderName)

  // Refuse to overwrite an existing directory. `mkdir({ recursive: true})`
  // silently succeeds on existing dirs, which means subsequent fs.writeFile
  // calls would overwrite any colliding files. Fail loud instead.
  const exists = await fs.stat(appDir).then(() => true).catch(() => false)
  if(exists){
    throw new Error(`Directory ${folderName} already exists at ${baseDir}. Refusing to overwrite.`)  
  }

  await fs.mkdir(appDir, { recursive: true })
  printSystem(chalk.cyan(`\n📁 Created directory: ${folderName}/`))

  for(const file of files){
    const filePath = path.join(appDir, file.path)
    const fileDir = path.dirname(filePath)

    await fs.mkdir(fileDir, { recursive: true })
    await fs.writeFile(filePath, file.content, "utf8")
    printSystem(chalk.green(`✅ ${file.path}`))
  }

  return appDir
}

// Generate application using structured output
export async function generateApplication(description, aiService, cwd = process.cwd()){
  try {
    printSystem(chalk.cyan("\n🤖 Agent Mode: Generating your application...\n"))
    printSystem(chalk.gray(`Request: ${description}\n`))
    printSystem(chalk.magenta("🤖 Agent Response: \n"))

    const result = await generateObject({ // returns "object" which we are calling "application"
      model: aiService.model,
      schema: ApplicationSchema,
      prompt: `Create a complete, production-ready application for ${description}
      
      CRITICAL REQUIREMENTS:
      1. Generate all files needed for the application to run
      2. Include package.json with all dependencies and correct versions (if needed)
      3. Include README.md with setup configurations
      4. Include configuration files (.gitignore, etc.) if needed
      5. Write clean, well-commented, production-ready code
      6. Include error handling and input validation
      7. Use modern JavaScript/TypeScript best practices
      8. Make sure all imports and paths are correct
      9. NO PLACEHOLDERS - everything must be complete and working
      10. For simple HTML/CSS/JS projects, you can skip package.json if not needed

      Provide:
      - A meaningful star-case folder name
      - All necessary files with complete content
      - Setup commands (fpr example: cd folder, npm install, npm run dev, or just open index.html)
      - Make it visually appealing and functional
      `
    })

    const application = result.object

    printSystem(chalk.green(`\n✅ Generated: ${application.folderName}\n`)) // coming from zod schema
    printSystem(chalk.gray(`Description: ${application.description}\n`))

    if(!application.files || application.files.length === 0){
      throw new Error("No files were generated")
    }

    printSystem(chalk.green(`Files: ${application.files.length}\n`))

    // Display file tree
    displayFileTree(application.files, application.folderName)

    // Create application directory and files
    printSystem(chalk.cyan("\n📝 Creating files...\n"))

    const appDir = await createApplicationFiles(cwd, application.folderName, application.files)

    // Display results
    printSystem(chalk.green.bold(`\n✨ Application created successfully!\n`))
    printSystem(chalk.cyan(`📁 Location: ${chalk.bold(appDir)}\n`))

    // Display setup commands
    if(application.setupCommands && application.setupCommands.length > 0){
      printSystem(chalk.cyan("🗒️ Next Steps:\n"))
      printSystem(chalk.white("```bash"))

      application.setupCommands.forEach((cmd) => {
        printSystem(chalk.white(cmd))
      })

      printSystem(chalk.white("```\n"))
    }
    else {
      printSystem(chalk.yellow("ℹ️ No setup commands provided\n"))
    }

    return {
      folderName: application.folderName,
      appDir,
      files: application.files.map(f => f.path),
      commands: application.setupCommands,
      success: true
    }

  } catch (error) {
    printSystem(chalk.red(`\n❌ Error generating application: ${error.message}\n`))
    if(error.stack){
      printSystem(chalk.dim(error.stack + "\n"))
    }
    throw error
  }
}
