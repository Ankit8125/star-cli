import { prisma } from "../lib/db.js"

export class ChatService {

  /**
   * Create a new conversation
   * @param {string} - userId
   * @param {string} - mode (chat, tool, agent)
   * @param {string} - title (optional conversation title)
   */

  async createConversation(userId, mode = "chat", title = null) {
    return prisma.conversation.create({
      data: {
        userId,
        mode,
        title: title || `New ${mode} conversation`
      }
    })
  }

  /**
   * Get/Create conversation of user
   * @param {string} - userId
   * @param {string} - conversationId (optional conversationId)
   * @param {string} - mode (chat, tool, agent)
   */

  async getOrCreateConversation(userId, conversationId = null, mode = "chat") {
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc"
            }
          }
        }
      })

      if(conversation) return conversation
    }

    // Create new conversation if not found or not provided
    return await this.createConversation(userId, mode)
  }

  /**
   * Add a message to conversation
   * @param {string} - conversation ID
   * @param {string} - role (User, Assistant, System, Tool)
   * @param {string|object} - message content
   */

  async addMessage(conversationId, role, content){
    // Convert content to JSON string if it's an object
    const contentString = typeof content === "string" ? content : JSON.stringify(content)    

    return await prisma.message.create({
      data: {
        conversationId,
        role,
        content: contentString
      }
    })
  }

  /**
   * Get conversation messages
   * @param {string} - conversationId
   */

  async getMessages(conversationId){
    const messages = await prisma.message.findMany({
      where: {
        conversationId
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    // Parse JSON content back to objects if needed
    return messages.map((msg) => ({
      ...msg,
      content: this.parseContent(msg.content)
    }))
  }

  /**
   * Get all conversations of a user
   * @param {string} - userId
   */

  async getUserConversations(userId){
    return await prisma.conversation.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })
  }

  /**
   * Delete a conversation
   * @param {string} - conversationID
   * @param {string} - userID (for security)
   */

  async deleteConversation(conversationId, userId){
    return await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId
      }
    })
  }

  /**
   * Update conversation title
   * @param {string} - conversationID
   * @param {string} - new title
   */
  async updateTitle(conversationId, title){
    return await prisma.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        title
      }
    })
  }

  /**
   * Helper to parse content (JSON or String)
   */

  parseContent(content){
    try {
      return JSON.parse(content)
    } catch (error) {
      return content
    }
  }

  /**
   * Format messages for AI SDK
   * @param {Array} - database messages
   */

  formatMessagesForAI(messages){

    return messages.map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    }))
  }
}