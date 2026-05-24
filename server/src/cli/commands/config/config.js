import chalk from "chalk"
import boxen from "boxen"
import { Command } from "commander"
import { select, text, isCancel, cancel } from "@clack/prompts"
import { getConfig, setApiKey, setModel } from "../../lib/config.js"

export const configCommand = new Command("config")
  .description("Manage local configurations (API key and active model)")
  .action(async () => {
    // Interactive configuration menu
    await runInteractiveMenu()
  })

// Add subcommands for direct CLI usage
configCommand
  .command("show")
  .description("Display active configurations")
  .action(() => {
    const config = getConfig()
    const maskedKey = config.googleApiKey
      ? `${config.googleApiKey.slice(0, 6)}...${config.googleApiKey.slice(-4)}`
      : chalk.red("Not Set")

    const configBox = boxen(
      `${chalk.bold("API Key:")} ${maskedKey}\n${chalk.bold("Model:")} ${chalk.cyan(config.model)}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        title: "⚙️ Star CLI Configurations"
      }
    )
    console.log(configBox)
  })

configCommand
  .command("set-key <key>")
  .description("Set your Google Gemini API Key")
  .action((key) => {
    if (!key.startsWith("AIzaSy")) {
      console.log(chalk.yellow("⚠️ Warning: Gemini API keys usually start with 'AIzaSy'."))
    }
    const success = setApiKey(key)
    if (success) {
      console.log(chalk.green("✅ Gemini API Key saved successfully!"))
    }
  })

configCommand
  .command("set-model <model>")
  .description("Set your preferred Google Gemini Model")
  .action((model) => {
    const success = setModel(model)
    if (success) {
      console.log(chalk.green(`✅ Preferred model updated to: ${chalk.cyan(model)}`))
    }
  })

async function runInteractiveMenu() {
  console.log(chalk.cyan("\n🛠️ Star CLI Local Configuration\n"))

  while (true) {
    const choice = await select({
      message: "What would you like to do?",
      options: [
        {
          value: "show",
          label: "View active configuration",
          hint: "Show saved API key and model"
        },
        {
          value: "set-key",
          label: "Update Gemini API Key",
          hint: "Set/overwrite your Google Gemini API Key"
        },
        {
          value: "set-model",
          label: "Select preferred AI model",
          hint: "Configure which Gemini model is active"
        },
        {
          value: "exit",
          label: "Exit Menu",
          hint: "Return to terminal"
        }
      ]
    })

    if (isCancel(choice) || choice === "exit") {
      break
    }

    if (choice === "show") {
      const config = getConfig()
      const maskedKey = config.googleApiKey
        ? `${config.googleApiKey.slice(0, 6)}...${config.googleApiKey.slice(-4)}`
        : chalk.red("Not Set")

      const configBox = boxen(
        `${chalk.bold("API Key:")} ${maskedKey}\n${chalk.bold("Model:")} ${chalk.cyan(config.model)}`,
        {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
          title: "Current Config"
        }
      )
      console.log(`\n${configBox}\n`)
    } 
    
    else if (choice === "set-key") {
      const config = getConfig()
      const keyInput = await text({
        message: "Enter your Google Gemini API Key:",
        placeholder: config.googleApiKey ? "Leave empty to keep existing key" : "AIzaSy...",
        validate(value) {
          if (!value && !config.googleApiKey) {
            return "API Key cannot be empty"
          }
        }
      })

      if (isCancel(keyInput)) {
        console.log(chalk.yellow("API Key update cancelled.\n"))
        continue
      }

      if (keyInput.trim().length > 0) {
        setApiKey(keyInput.trim())
        console.log(chalk.green("\n✅ API Key saved locally!\n"))
      }
    } 
    
    else if (choice === "set-model") {
      const config = getConfig()
      const modelInput = await select({
        message: "Select Gemini Model:",
        options: [
          { value: "gemini-2.5-flash", label: "gemini-2.5-flash (Recommended)", hint: "Fastest, multimodal, excellent reasoning" },
          { value: "gemini-2.5-pro", label: "gemini-2.5-pro", hint: "Complex code and multi-step reasoning" },
          { value: "gemini-1.5-flash", label: "gemini-1.5-flash", hint: "High performance for general tasks" },
          { value: "custom", label: "Custom Model Name", hint: "Enter a custom Gemini model string" }
        ]
      })

      if (isCancel(modelInput)) {
        console.log(chalk.yellow("Model update cancelled.\n"))
        continue
      }

      if (modelInput === "custom") {
        const customName = await text({
          message: "Enter custom Gemini model name:",
          placeholder: "e.g., gemini-2.0-flash-exp",
          validate(value) {
            if (!value || value.trim().length === 0) {
              return "Model name cannot be empty"
            }
          }
        })

        if (isCancel(customName)) {
          console.log(chalk.yellow("Model update cancelled.\n"))
          continue
        }

        setModel(customName.trim())
        console.log(chalk.green(`\n✅ Model updated to custom model: ${chalk.cyan(customName.trim())}\n`))
      } else {
        setModel(modelInput)
        console.log(chalk.green(`\n✅ Model updated to: ${chalk.cyan(modelInput)}\n`))
      }
    }
  }
}
