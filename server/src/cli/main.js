#!/usr/bin/env node

// This "shebang" line (line no. 1) tells your OS to run this file using Node.js. This is what makes it executable as a script.
import dotenv from "dotenv"
import chalk from "chalk"
import figlet from "figlet"
import { Command } from "commander"
import { login, logout, whoami } from "./commands/auth/login.js"

dotenv.config()

async function main() {
  // Display Banner
  console.log(
    chalk.cyan(
      figlet.textSync("Star CLI", {
        font: "Standard",
        horizontalLayout: "default"
      })
    )
  )

  console.log(chalk.red("A cli based AI Tool \n"))

  const program = new Command("star")

  program
    .version("0.0.1")
    .description("Star CLI - A CLI based AI Tool")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)

  // Default action that shows help 
  program.action(() => {
    program.help()
  })

  program.parse()
}

main().catch((err) => {
  console.log(chalk.red("Error running star CLI:"), err);
  process.exit(1)
})