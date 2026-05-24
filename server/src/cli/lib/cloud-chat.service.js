import { apiClient } from "./api.js"

export class CloudChatService {
  /**
   * Create a new conversation
   * @param {string} userId (Unused on server side as server infers it from token)
   * @param {string} mode (chat, tool, agent)
   * @param {string} title (optional conversation title)
   */
  async createConversation(userId, mode = "chat", title = null) {
    return await apiClient("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ mode, title })
    })
  }

  /**
   * Get/Create conversation of user
   * @param {string} userId
   * @param {string} conversationId (optional)
   * @param {string} mode (chat, tool, agent)
   */
  async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    if (conversationId) {
      try {
        const messages = await this.getMessages(conversationId)
        
        // Find conversation details
        const conversations = await this.getUserConversations(userId)
        const conversation = conversations.find((c) => c.id === conversationId)

        if (conversation) {
          return {
            ...conversation,
            messages
          }
        }
      } catch (error) {
        // Fallback to create new one if fetching failed
      }
    }

    // Create new conversation
    return await this.createConversation(userId, mode)
  }

  /**
   * Add a message to conversation
   * @param {string} conversationId
   * @param {string} role (user, assistant, system, tool)
   * @param {string|object} content
   */
  async addMessage(conversationId, role, content) {
    return await apiClient(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ role, content })
    })
  }

  /**
   * Get conversation messages
   * @param {string} conversationId
   */
  async getMessages(conversationId) {
    const messages = await apiClient(`/api/conversations/${conversationId}/messages`)
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
    return await apiClient("/api/conversations")
  }

  /**
   * Delete a conversation
   * @param {string} conversationId
   * @param {string} userId
   */
  async deleteConversation(conversationId, userId) {
    return await apiClient(`/api/conversations/${conversationId}`, {
      method: "DELETE"
    })
  }

  /**
   * Update conversation title
   * @param {string} conversationId
   * @param {string} title
   */
  async updateTitle(conversationId, title) {
    return await apiClient(`/api/conversations/${conversationId}/title`, {
      method: "PUT",
      body: JSON.stringify({ title })
    })
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
