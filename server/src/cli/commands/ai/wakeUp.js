import chalk from "chalk"
import { Command } from "commander"
import yoctoSpinner from "yocto-spinner"
import { getStoredToken, clearStoredToken } from "../../../lib/token.js"
import { apiClient } from "../../lib/api.js"
import { select, confirm, isCancel } from "@clack/prompts"
import { startChat } from "../../chat/chat-with-ai.js"
import { startToolChat } from "../../chat/chat-with-ai-tools.js"
import { startAgentChat } from "../../chat/chat-with-ai-agent.js"

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
  
  let user = null;
  try {
    const sessionData = await apiClient("/api/me");
    user = sessionData?.user;
  } catch (error) {
    // Handle error or user not found
  }

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
        label: "Chat",
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
        hint: "Advanced AI Agent"
      },
      {
        value: "logout",
        label: "Logout",
        hint: "Logout from Star CLI"
      }
    ]
  })

  switch (choice) {
    case "chat":
      console.log("Chat is selected")
      await startChat("chat")
      break
    
    case "tool":
      console.log(chalk.green("Tool calling is selected"))
      await startToolChat()
      break
    
    case "agent":
      console.log(chalk.yellow("Agentic mode coming soon..."))
      await startAgentChat()
      break

    case "logout":
      await handleLogout()
      break
  }
}

async function handleLogout() {
  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false
  })

  if (isCancel(shouldLogout) || !shouldLogout) {
    console.log(chalk.yellow("Logout cancelled."))
    return
  }

  const spinner = yoctoSpinner({ text: "Logging out..." })
  spinner.start()

  const cleared = await clearStoredToken()

  spinner.stop()

  if (cleared) {
    console.log(chalk.green("✅ Successfully logged out!"))
    console.log(chalk.gray("Run 'star login' to authenticate again.\n"))
  } else {
    console.log(chalk.yellow("⚠️ Could not clear token file."))
  }
}

export const wakeUp = new Command("wakeup")
                            .description("Wake up Star AI")
                            .action(wakeUpAction)