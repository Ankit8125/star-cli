import chalk from "chalk"
import boxen from "boxen"
import { text, isCancel, cancel, intro, outro } from "@clack/prompts"
import yoctoSpinner from "yocto-spinner"
import { marked } from "marked"
import { markedTerminal } from "marked-terminal"
import { AIService } from "../ai/google-service.js"
import { LocalChatService } from "../lib/local-chat.service.js"
import { CloudChatService } from "../lib/cloud-chat.service.js"
import { getStoredToken } from "../../lib/token.js"
import { apiClient } from "../lib/api.js"

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline
  })
)

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

async function initConversation(chatService, userId, conversationId = null, mode = "chat") {
  const spinner = yoctoSpinner({ text: "Loading conversation..." }).start()
  const conversation = await chatService.getOrCreateConversation(userId, conversationId, mode)
  spinner.success("Conversation Loaded")

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}\n${chalk.gray("ID: " + conversation.id)}\n${chalk.gray("Storage: " + (chatService instanceof CloudChatService ? "Cloud Sync" : "Local Database"))}`,
     {
      padding: 1,
      margin: { top: 1, bottom: 1},
      borderStyle: "round",
      borderColor: "cyan",
      title: "💭 Chat Session",
      titleAlignment: "center"
     }
  )

  console.log(conversationInfo)

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("🗒️ Previous messages: \n"))
    displayMessages(conversation.messages);
  }

  return conversation
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "🙋 You",
        titleAlignment: "left"
      })
      console.log(userBox)
    } else {
      const renderedContent = marked.parse(msg.content)
      const assistantBox = boxen(renderedContent.trim(), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "🤖 Assistant",
        titleAlignment: "left"
      })
      console.log(assistantBox)
    }
  })
}

async function getAIResponse(chatService, conversationId, runMode) {
  const spinner = yoctoSpinner({
    text: "Star is thinking...",
    color: "cyan"
  }).start()

  const dbMessages = await chatService.getMessages(conversationId)
  const aiMessages = await chatService.formatMessagesForAI(dbMessages)

  let fullResponse = ""
  let isFirstChunk = true

  const handleChunk = (chunk) => {
    if (isFirstChunk) {
      spinner.stop()
      console.log("\n")
      console.log(chalk.green.bold("🤖 Assistant:"))
      console.log(chalk.gray("—".repeat(60)))
      isFirstChunk = false
    }
    fullResponse += chunk
    process.stdout.write(chunk)
  }

  try {
    if (runMode === "cloud") {
      const backendUrl = process.env.STAR_BACKEND_URL || process.env.BETTER_AUTH_URL || "http://localhost:5000"
      const token = await getStoredToken()
      
      const response = await fetch(`${backendUrl}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token?.access_token || ""}`
        },
        body: JSON.stringify({ messages: aiMessages })
      })

      if (!response.ok) {
        throw new Error(`SaaS API Stream Error: ${response.statusText}`)
      }

      for await (const chunk of response.body) {
        const text = new TextDecoder().decode(chunk)
        handleChunk(text)
      }
    } else {
      const aiService = new AIService()
      await aiService.sendMessage(aiMessages, (chunk) => {
        handleChunk(chunk)
      })
    }

    console.log("\n" + chalk.gray("—".repeat(60)) + "\n")
    return fullResponse
  } catch (error) {
    spinner.error("Failed to get AI response.")
    throw error 
  }
}

async function updateConversationTitle(chatService, conversationId, userInput, messageCount) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "")
    await chatService.updateTitle(conversationId, title)
  }
}

async function chatLoop(chatService, conversation, runMode) {
  const helpbox = boxen(
    `${chalk.gray('● Type your message and press Enter')}\n${chalk.gray('● Type "exit" to end conversation')}\n${chalk.gray('● Press Ctrl+C to quit anytime.')}`, {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true 
    }
  )

  console.log(helpbox)

  while (true) {
    const userInput = await text({
      message: chalk.blue("💭 Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.trim().length === 0) {
          return "Message cannot be empty";
        }
      }
    })

    if (isCancel(userInput) || userInput.toLowerCase() === "exit") {
      const exitBox = boxen(
        chalk.yellow("Chat session ended. Bye bye! 👋"), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "yellow"
        }
      )
      console.log(exitBox)
      break
    }

    await chatService.addMessage(conversation.id, "user", userInput)
    const messages = await chatService.getMessages(conversation.id)
    
    const aiResponse = await getAIResponse(chatService, conversation.id, runMode)
    
    await chatService.addMessage(conversation.id, "assistant", aiResponse)
    await updateConversationTitle(chatService, conversation.id, userInput, messages.length)
  }
}

export async function startChat(mode = "chat", conversationId = null, runMode = "local") {
  try {
    console.log(boxen(chalk.bold.cyan(`Star AI Chat (${runMode === "cloud" ? "SaaS" : "Local"})`), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan"
      })
    )
    
    const chatService = runMode === "cloud" ? new CloudChatService() : new LocalChatService()
    const user = await getUserContext(runMode)
    const conversation = await initConversation(chatService, user.id, conversationId, mode)
    
    await chatLoop(chatService, conversation, runMode)

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