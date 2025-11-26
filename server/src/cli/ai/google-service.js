import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { config } from "../../config/google.config.js"
import chalk from "chalk"


// TODO: Rewrite this service in latest v3 version. It is in v2 version.
export class AIService {
  
  constructor() {
    if(!config.googleApiKey){ // TODO: Add OpenAI rule as well.
      throw new Error("GOOGLE_API_KEY is not set in env")
    }

    this.model = google(config.model, {
      apiKey: config.googleApiKey
    })
  }

  /**
   * Send a message and get streaming response
   * @param {Array} - Array of messages
   * @param {Function} - callback function to get text from the stream
   * @param {Object} - tools
   * @param {Function} - onToolCall
   * @return {Promise<Object>}
   */

  async sendMessage(messages, onChunk, tools = undefined, onToolCall = null){
    try {
      const streamConfig = {
        model: this.model,
        messages: messages
      }

      const result = streamText(streamConfig)

      let fullResponse = ""

      for await(const chunk of result.textStream){
        fullResponse += chunk;
        if(onChunk){
          onChunk(chunk)
        }
      }

      const fullResult = result

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage
      }
      
    } catch (error) {
      console.error(chalk.red("AI Service Error:"), error.message)
      throw error
    }
  }

  /**
   * Get a non-streaming response
   * @param {Array} - Array of message objects
   * @param {Object} - optional tools
   * @return {Promise<string>} - response text
   */

  async getMessage(messages, tools=undefined){
    let fullResponse = ""
    await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk
    })
    return fullResponse
  }
}

