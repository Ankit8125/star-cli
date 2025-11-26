import chalk from "chalk"
import { Command } from "commander"
import yoctoSpinner from "yocto-spinner"
import { getStoredToken } from "../../../lib/token.js"
import { prisma } from "../../../lib/db.js"
import { select } from "@clack/prompts"

const wakeUpAction = async () => {
  const token = await getStoredToken()

  // We want user to be logged in 
  if (!token?.access_token) {
    console.log(chalk.red("Not Authenticated. Please login"))
    return
  }

  const spinner = yoctoSpinner({ text: "Fetching user information..." })
  spinner.start()

  // TODO: Implement Redis cache here to store the currently logged in user data instead of calling DB always. 
  // So my CLI will always fetch from that cached DB instead of calling actual DB. As we are going to call this `wakeup` comman many times
  
  const user = await prisma.user.findFirst({ // Why 'findFirst' ? Because we do not have any unique field to identify user.
    where: {
      sessions: {
        some: {
          token: token.access_token
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  })

  spinner.stop()

  if (!user) {
    console.log(chalk.red("User not found."))
    return
  }

  console.log(chalk.green(`Welcome back, ${user.name}! \n`))

  const choice = await select({
    message: "Select an Option:",
    options: [
      {
        value: "chat",
        label: "chat",
        hint: "Simple chat with AI"
      },
      {
        value: "tool",
        label: "Tool Calling",
        hint: "Chat with tools (Google Search, Code Execution)"
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI Agent (TODO)"
      },
    ]
  })

  switch (choice) {
    case "chat":
      console.log("Chat is selected")
      break
    
    case "tool":
      console.log(chalk.green("Tool calling is selected"))
      break
    
    case "agent":
      console.log(chalk.yellow("Agentic mode coming soon..."))
      break
  }

  

}

export const wakeUp = new Command("wakeup")
                            .description("Wake up Star AI")
                            .action(wakeUpAction)