import fs from "fs"
import path from "path"
import os from "os"
import crypto from "crypto"

const CONFIG_DIR = path.join(os.homedir(), ".star-cli")
const HISTORY_FILE = path.join(CONFIG_DIR, "history.json")

function ensureHistoryFile() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true })
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ conversations: [], messages: [] }, null, 2), "utf-8")
  }
}

function readHistory() {
  ensureHistoryFile()
  try {
    const data = fs.readFileSync(HISTORY_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    return { conversations: [], messages: [] }
  }
}

function writeHistory(history) {
  try {
    ensureHistoryFile()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8")
    return true
  } catch (error) {
    console.error("Failed to save chat history:", error.message)
    return false
  }
}

export class LocalChatService {
  /**
   * Create a new conversation
   * @param {string} userId
   * @param {string} mode (chat, tool, agent)
   * @param {string} title (optional conversation title)
   */
  async createConversation(userId, mode = "chat", title = null) {
    const history = readHistory()
    const now = new Date().toISOString()
    const newConversation = {
      id: crypto.randomUUID(),
      userId: userId || "local-user",
      title: title || `New ${mode} conversation`,
      mode: mode,
      createdAt: now,
      updatedAt: now
    }

    history.conversations.push(newConversation)
    writeHistory(history)
    return newConversation
  }

  /**
   * Get/Create conversation of user
   * @param {string} userId
   * @param {string} conversationId (optional)
   * @param {string} mode (chat, tool, agent)
   */
  async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    const history = readHistory()
    
    if (conversationId) {
      const conversation = history.conversations.find(
        (c) => c.id === conversationId && c.userId === userId
      )

      if (conversation) {
        // Fetch and append sorted messages
        const conversationMessages = history.messages
          .filter((m) => m.conversationId === conversationId)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

        return {
          ...conversation,
          messages: conversationMessages
        }
      }
    }

    // Create new conversation if not found or not provided
    return await this.createConversation(userId, mode)
  }

  /**
   * Add a message to conversation
   * @param {string} conversationId
   * @param {string} role (user, assistant, system, tool)
   * @param {string|object} content
   */
  async addMessage(conversationId, role, content) {
    const history = readHistory()
    const contentString = typeof content === "string" ? content : JSON.stringify(content)
    const now = new Date().toISOString()

    const newMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId,
      role: role,
      content: contentString,
      createdAt: now
    }

    history.messages.push(newMessage)

    // Update conversation's updatedAt timestamp
    const conversation = history.conversations.find((c) => c.id === conversationId)
    if (conversation) {
      conversation.updatedAt = now
    }

    writeHistory(history)
    return {
      ...newMessage,
      content: this.parseContent(newMessage.content)
    }
  }

  /**
   * Get conversation messages
   * @param {string} conversationId
   */
  async getMessages(conversationId) {
    const history = readHistory()
    const messages = history.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    return messages.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content)
    }))
  }

  /**
   * Get all conversations of a user
   * @param {string} userId
   */
  async getUserConversations(userId) {
    const history = readHistory()
    const userConvs = history.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    return userConvs.map((conv) => {
      const convMessages = history.messages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // desc for take 1

      return {
        ...conv,
        messages: convMessages.slice(0, 1)
      }
    })
  }

  /**
   * Delete a conversation
   * @param {string} conversationId
   * @param {string} userId (security)
   */
  async deleteConversation(conversationId, userId) {
    const history = readHistory()
    
    // Filter out target conversation
    const initialConversationsLength = history.conversations.length
    history.conversations = history.conversations.filter(
      (c) => !(c.id === conversationId && c.userId === userId)
    )

    if (history.conversations.length < initialConversationsLength) {
      // Also delete associated messages
      history.messages = history.messages.filter((m) => m.conversationId !== conversationId)
      writeHistory(history)
      return { count: 1 }
    }

    return { count: 0 }
  }

  /**
   * Update conversation title
   * @param {string} conversationId
   * @param {string} title
   */
  async updateTitle(conversationId, title) {
    const history = readHistory()
    const conversation = history.conversations.find((c) => c.id === conversationId)
    
    if (conversation) {
      conversation.title = title
      conversation.updatedAt = new Date().toISOString()
      writeHistory(history)
      return conversation
    }

    throw new Error(`Conversation not found: ${conversationId}`)
  }

  /**
   * Helper to parse content (JSON or String)
   */
  parseContent(content) {
    try {
      return JSON.parse(content)
    } catch (error) {
      return content
    }
  }

  /**
   * Format messages for AI SDK
   * @param {Array} messages database messages
   */
  formatMessagesForAI(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    }))
  }
}
