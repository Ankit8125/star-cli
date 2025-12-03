import { google } from '@ai-sdk/google';
import { generateObject, streamText } from 'ai';
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
      
      if(tools && Object.keys(tools).length > 0){
        streamConfig.tools = tools
        streamConfig.maxSteps = 5 // Allow up to 5 tool call steps

        console.log(
          chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(", ")}`)
        )
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

      const toolCalls = []
      const toolResults = []

      if(fullResult.steps && Array.isArray(fullResult.steps)){
        for(const step of fullResult.steps){
          if(step.toolCalls && step.toolCalls.length > 0){
            for(const toolCall of step.toolCalls){
              toolCalls.push(toolCall)

              if(onToolCall){
                onToolCall(toolCall)
              }
            }
          }

          if(step.toolResults && step.toolResults.length > 0){
            toolResults.push(...step.toolResults)
          }
        }
      }

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
        toolCalls,
        toolResults,
        steps: fullResponse.steps
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
    
    const result = await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk
    }, tools)

    return result.content
  }

  /**
 * Generate structured output using a zod schema
 * @param {Object} - Zod schema
 * @param {string} - Prompt for generation
 * @returns {Promise<Object>} - parsed object matching the schema
 */

  async generateStructured(schema, prompt){
    try {
      const result = await generateObject({
        model: this.model,
        schema: schema,
        prompt: prompt
      })

      return result.object
    } catch (error) {
      console.error(chalk.red("AI Structured Generation Error:"), error.message)
      throw error
    }
  }

}