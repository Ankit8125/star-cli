import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, streamText, stepCountIs } from 'ai';
import { config } from "../../config/google.config.js"
import chalk from "chalk"

export class AIService {

  constructor() {
    if(!config.googleApiKey){
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set in env")
    }

    const provider = createGoogleGenerativeAI({ apiKey: config.googleApiKey })
    this.model = provider(config.model)
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
        streamConfig.stopWhen = stepCountIs(5) // AI SDK v5: stopWhen replaces maxSteps

        if(process.env.DEBUG){
          console.log(
            chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(", ")}`)
          )
        }
      }

      const result = streamText(streamConfig)

      let fullResponse = ""

      for await(const chunk of result.textStream){
        fullResponse += chunk;
        if(onChunk){
          onChunk(chunk)
        }
      }

      // In AI SDK v5 these are Promises on the StreamTextResult, not synchronous values
      const [steps, finishReason, usage] = await Promise.all([
        result.steps,
        result.finishReason,
        result.totalUsage,
      ])

      const toolCalls = []
      const toolResults = []

      if(Array.isArray(steps)){
        for(const step of steps){
          if(step.toolCalls && step.toolCalls.length > 0){
            for(const toolCall of step.toolCalls){
              toolCalls.push(toolCall)
              if(onToolCall) onToolCall(toolCall)
            }
          }
          if(step.toolResults && step.toolResults.length > 0){
            toolResults.push(...step.toolResults)
          }
        }
      }

      return {
        content: fullResponse,
        finishReason,
        usage,
        toolCalls,
        toolResults,
        steps,
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
    const result = await this.sendMessage(messages, null, tools)
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