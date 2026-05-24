import chalk from "chalk"
import boxen from "boxen"
import { text, isCancel, cancel, intro, outro, confirm } from "@clack/prompts"
import yoctoSpinner from "yocto-spinner"
import { AIService } from "../ai/google-service.js"
import { LocalChatService } from "../lib/local-chat.service.js"
import { CloudChatService } from "../lib/cloud-chat.service.js"
import { generateApplication } from "../../config/agent.config.js"
import { apiClient } from "../lib/api.js"

async function getUserContext(runMode) {
  if (runMode === "cloud") {
    const spinner = yoctoSpinner({ text: "Verifying cloud authentication..." }).start()
    try {
      const sessionData = await apiClient("/api/me")
      const user = sessionData?.user
      if (!user) {
        spinner.error("Cloud session invalid.")
        throw new Error("Cloud session not found. Please run 'star login'.")
      }
      spinner.success(`Connected as ${user.name} (SaaS)`)
      return user
    } catch (err) {
      spinner.error("Connection failed.")
      throw new Error(`Could not connect to SaaS server: ${err.message}`)
    }
  } else {
    return { id: "local-user", name: "User" }
  }
}

async function initConversation(chatService, userId, conversationId = null, mode = "agent") {
  const conversation = await chatService.getOrCreateConversation(userId, conversationId, mode)

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n` + 
    `${chalk.gray("ID: " + conversation.id)}\n` +
    `${chalk.gray("Storage:")} ${chatService instanceof CloudChatService ? "Cloud Sync" : "Local Database"}\n` + 
    `${chalk.gray("Working Directory:")} ${process.cwd()}`,
     {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "magenta",
      title: "🤖 Agent Mode",
      titleAlignment: "center"
     }
  )

  console.log(conversationInfo)
  return conversation
}

async function agentLoop(chatService, conversation, aiService, runMode) {
  const helpBox = boxen(
    `${chalk.cyan.bold("What can the agent do?")}\n\n` + 
    `${chalk.gray('• Generate complete applications from descriptions')}\n` +
    `${chalk.gray('• Create all necessary files and folders')}\n` +
    `${chalk.gray('• Include setup instructions and commands')}\n` +
    `${chalk.gray('• Generate production-ready code')}\n\n` +
    `${chalk.yellow.bold('Examples:')}\n` +
    `${chalk.white('• "Build a todo app with React and Tailwind"')}\n` +
    `${chalk.white('• "Create a REST API with Express and MongoDB"')}\n` +
    `${chalk.white('• "Make a weather app using OpenWeatherMap API"')}\n\n` +
    `${chalk.gray('Type "exit" to end the session')}\n`, {
    padding: 1,
    margin: { bottom: 1 },
    borderStyle: "round",
    borderColor: "cyan",
    title: "💡 Agent Instructions"
  })

  console.log(helpBox)

  while (true) {
    const userInput = await text({
      message: chalk.magenta("🤖 What would you like to build?"),
      placeholder: "Describe your application...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Description cannot be empty."
        }
        if (value.trim().length < 10) {
          return "Please provide more details (at least 10 characters)"
        }
      }
    })

    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      console.log(chalk.yellow("\n👋 Agent session ended\n"))
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "👤 Your Request",
      titleAlignment: "left"
    })
    
    console.log(userBox)

    await chatService.addMessage(conversation.id, "user", userInput)

    try {
      const result = await generateApplication(userInput, aiService, process.cwd(), runMode)

      if (result?.success) {
        const responseMessage = `Generated application: ${result.folderName}\n` + 
        `Files created: ${result.files.length}\n` + 
        `Location: ${result.appDir}\n` +
        `Setup commands:\n${result.commands.join("\n")}`

        await chatService.addMessage(conversation.id, "assistant", responseMessage)

        const continuePrompt = await confirm({
          message: chalk.cyan("Would you like to generate another application?"),
          initialValue: false
        })

        if (isCancel(continuePrompt) || !continuePrompt) {
          console.log(chalk.yellow("\nGreat! Check your new application.\n"))
          break
        }
      } else {
        throw new Error("Generation returned no result.")
      }
    } catch (error) {
      console.log(chalk.red(`\n❌ Error: ${error.message}\n`))     
      await chatService.addMessage(conversation.id, "assistant", `Error: ${error.message}`)
      
      const retry = await confirm({
        message: chalk.cyan("Would you like to try again?"),
        initialValue: true
      })

      if (isCancel(retry) || !retry) {
        break
      }
    }
  }
}

export async function startAgentChat(conversationId = null, runMode = "local") {
  try {
    intro(boxen(
      chalk.bold.magenta(`🤖 Star AI - Agent Mode (${runMode === "cloud" ? "SaaS" : "Local"}) \n\n`) + 
      chalk.gray("Autonomous Application Generator"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "magenta"
      }
    ))

    const chatService = runMode === "cloud" ? new CloudChatService() : new LocalChatService()
    const user = await getUserContext(runMode)

    // Warning about file system access
    const shouldContinue = await confirm({
      message: chalk.yellow("⚠️ The agent will create files and folders in the current directory. Continue ?"),
      initialValue: true
    })

    if (isCancel(shouldContinue) || !shouldContinue) {
      cancel(chalk.yellow("Agent mode cancelled"))
      process.exit(0)
    }

    const conversation = await initConversation(chatService, user.id, conversationId)
    
    // Only instantiate local AIService if we are in local mode
    const aiService = runMode === "local" ? new AIService() : null
    await agentLoop(chatService, conversation, aiService, runMode)

    outro(chalk.green.bold("\n✨ Thanks for using Agent Mode!"))

  } catch (error) {
    const errorBox = boxen(chalk.red(`❌ Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red"
    })
    console.log(errorBox)
    process.exit(1)
  }
}