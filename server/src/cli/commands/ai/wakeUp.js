import chalk from "chalk"
import { Command } from "commander"
import os from "os"
import fs from "fs"
import path from "path"
import { select, confirm, text, isCancel, cancel } from "@clack/prompts"
import { startChat } from "../../chat/chat-with-ai.js"
import { startToolChat } from "../../chat/chat-with-ai-tools.js"
import { startAgentChat } from "../../chat/chat-with-ai-agent.js"
import { getApiKey, setApiKey } from "../../lib/config.js"
import { getStoredToken, isTokenExpired, clearStoredToken } from "../../../lib/token.js"
import { apiClient } from "../../lib/api.js"
import { loginAction } from "../auth/login.js"

const CONFIG_DIR = path.join(os.homedir(), ".star-cli")

const wakeUpAction = async () => {
  // 1. Check if authenticated
  const token = await getStoredToken()
  const tokenExpired = await isTokenExpired()
  const isCloudMode = token?.access_token && !tokenExpired

  let user = null
  if (isCloudMode) {
    try {
      const sessionData = await apiClient("/api/me")
      user = sessionData?.user
    } catch (err) {
      // Server down, token expired, etc. -> fallback to local
    }
  }

  if (user) {
    // === SaaS CLOUD MODE FLOW ===
    console.log(chalk.cyan(`☁️  Connected to Star SaaS (Cloud Mode)`))
    console.log(chalk.green(`Welcome back, ${user.name}! \n`))

    const choice = await select({
      message: "Select an Option:",
      options: [
        {
          value: "chat",
          label: "Chat (Cloud)",
          hint: "Chat synced with your cloud account"
        },
        {
          value: "tool",
          label: "Tool Calling (Cloud)",
          hint: "Chat with tools using cloud backend"
        },
        {
          value: "agent",
          label: "Agentic Mode (Cloud)",
          hint: "Advanced AI Agent (Generates code in current folder)"
        },
        {
          value: "local_switch",
          label: "Use Local-First (Guest) Mode instead",
          hint: "Bypass SaaS and use your own Gemini key"
        },
        {
          value: "logout",
          label: "Logout",
          hint: "Sign out of your Star SaaS account"
        }
      ]
    })

    if (isCancel(choice)) {
      console.log(chalk.yellow("\nGoodbye! 👋\n"))
      process.exit(0)
    }

    switch (choice) {
      case "chat":
        await startChat("chat", null, "cloud")
        break
      
      case "tool":
        await startToolChat(null, "cloud")
        break
      
      case "agent":
        await startAgentChat(null, "cloud")
        break

      case "local_switch":
        console.log(chalk.yellow("\nSwitched to Local-First Mode temporarily."))
        await startLocalFlow()
        break

      case "logout":
        await handleLogout()
        break
    }
  } else {
    // === LOCAL-FIRST BYOK GUEST MODE FLOW ===
    await startLocalFlow()
  }
}

async function startLocalFlow() {
  let apiKey = getApiKey()

  // Prompt for API key if not configured
  if (!apiKey) {
    console.log(chalk.yellow("🌟 Welcome to Star CLI! Let's set up your Google Gemini API Key first.\n"))
    console.log(chalk.gray("You can obtain a free API key from Google AI Studio: https://aistudio.google.com/\n"))

    const keyInput = await text({
      message: "Enter your Google Gemini API Key (or type 'login' to sign in to SaaS Cloud Mode):",
      placeholder: "AIzaSy...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "API Key cannot be empty"
        }
      }
    })

    if (isCancel(keyInput)) {
      cancel("Setup cancelled.")
      process.exit(0)
    }

    if (keyInput.trim().toLowerCase() === "login") {
      await loginAction({})
      // Restart wakeup action in cloud mode
      await wakeUpAction()
      return
    }

    setApiKey(keyInput.trim())
    console.log(chalk.green("\n✅ Gemini API Key saved locally!\n"))
  }

  const username = os.userInfo().username || "Explorer"
  console.log(chalk.yellow(`🏠 Running in Local-First Mode (Guest)`))
  console.log(chalk.green(`Welcome back, ${username}! \n`))

  const choice = await select({
    message: "Select an Option:",
    options: [
      {
        value: "chat",
        label: "Chat (Local)",
        hint: "Simple chat saved locally on your machine"
      },
      {
        value: "tool",
        label: "Tool Calling (Local)",
        hint: "Chat with tools using your local key"
      },
      {
        value: "agent",
        label: "Agentic Mode (Local)",
        hint: "Advanced AI Agent (Generates code in current folder)"
      },
      {
        value: "login",
        label: "Sign in to Star SaaS (Cloud Sync)",
        hint: "Enable cloud database history sync and free master AI key"
      },
      {
        value: "reset",
        label: "Reset Local Configuration",
        hint: "Clear local API Key and history"
      }
    ]
  })

  if (isCancel(choice)) {
    console.log(chalk.yellow("\nGoodbye! 👋\n"))
    process.exit(0)
  }

  switch (choice) {
    case "chat":
      await startChat("chat", null, "local")
      break
    
    case "tool":
      await startToolChat(null, "local")
      break
    
    case "agent":
      await startAgentChat(null, "local")
      break

    case "login":
      await loginAction({})
      await wakeUpAction() // Restart wakeup once logged in
      break

    case "reset":
      await handleReset()
      break
  }
}

async function handleLogout() {
  const shouldLogout = await confirm({
    message: "Are you sure you want to log out of your cloud account?",
    initialValue: false
  })

  if (isCancel(shouldLogout) || !shouldLogout) {
    console.log(chalk.yellow("Logout cancelled."))
    return
  }

  try {
    await apiClient("/api/auth/sign-out", { method: "POST" })
  } catch (err) {
    // Clear local token anyway
  }

  const cleared = await clearStoredToken()
  if (cleared) {
    console.log(chalk.green("\n✅ Successfully logged out from SaaS!"))
    console.log(chalk.gray("Running 'star wakeup' next time will fall back to Local-First Mode.\n"))
  } else {
    console.log(chalk.yellow("⚠️ Could not clear session token file."))
  }
}

async function handleReset() {
  const shouldReset = await confirm({
    message: "Are you sure you want to clear your local configuration and history?",
    initialValue: false
  })

  if (isCancel(shouldReset) || !shouldReset) {
    console.log(chalk.yellow("Reset cancelled."))
    return
  }

  try {
    if (fs.existsSync(CONFIG_DIR)) {
      const configPath = path.join(CONFIG_DIR, "config.json")
      const historyPath = path.join(CONFIG_DIR, "history.json")

      if (fs.existsSync(configPath)) fs.unlinkSync(configPath)
      if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath)
      
      console.log(chalk.green("\n✅ Configuration and history successfully cleared!"))
      console.log(chalk.gray("Run 'star wakeup' to configure a new API key.\n"))
    }
  } catch (error) {
    console.log(chalk.red(`⚠️ Could not clear configuration directory: ${error.message}`))
  }
}

export const wakeUp = new Command("wakeup")
                            .description("Wake up Star AI")
                            .action(wakeUpAction)