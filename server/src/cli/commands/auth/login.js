import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts"
import { logger } from "better-auth"
import { createAuthClient } from "better-auth/client"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import chalk from "chalk"
import { Command } from "commander"
import fs from "node:fs/promises"
import open from "open"
import os from "os"
import path from "path"
import yoctoSpinner from "yocto-spinner"
import * as z from "zod"
import dotenv from "dotenv"
import { prisma } from "../../../lib/db.js"

dotenv.config()

const URL = "http://localhost:5000"
const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const CONFIG_DIR = path.join(os.homedir(), ".better-auth")
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json")

export async function loginAction() {

  const options = z.object({
    serverUrl: z.string().optional(),
    clientId: z.string().optional()
  })

  const serverUrl = options.serverUrl || URL
  const clientId = options.clientId || CLIENT_ID

  intro(chalk.bold("🔒Better Auth CLI Login"))

  // TODO: CHANGE THIS WITH TOKEN MANAGEMENT
  const existingToken = false;
  const expired = false;

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already loggedIn. Do you want to login again?",
      initialValue: false
    })
    // The confirm prompt returns one of three things: 
    // true (User selected Yes), false (User selected No), symbol (User pressed Ctrl+C to cancel || and this specific case is detected by isCancel())

    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel("Login Cancelled")
      process.exit(0)
    }
  }
}

// Commander Setup
export const login = new Command("login")
                          .description("Login to Better Auth")
                          .option("--server-url <url>", "The Better Auth server URL", URL)
                          .option("--client-id <id>", "The OAuth Client ID", CLIENT_ID)
                          .action(loginAction)