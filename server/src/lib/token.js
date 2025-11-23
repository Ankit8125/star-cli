import { TOKEN_FILE, CONFIG_DIR } from "../cli/commands/auth/login.js";

export async function getStoredToken(){
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8")
    const token = JSON.parse(data)
    return token
  } catch (error) {
    return null; // File doesn't exist or can't be read
  }
}

export async function storeToken(token){
  try {
    // Ensure config directory exists
    await fs.mkdir(CONFIG_DIR, {recursive: true})

    // Store token with metadata
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token, // Store if available
      token_type: token.token_type || "Bearer",
      scope: token.scope,
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in*1000).toISOString() : null,
      created_at: new Date().toISOString(),
    }

    const token = JSON.stringify(tokenData, null, 2)

    await fs.writeFile(TOKEN_FILE, token, "utf-8")
    return true
  } catch (error) {
    console.error(
      chalk.red("Failed to store token: "), error.message
    )
    return false
  }
}

export async function clearStoredToken(){
  try {
    await fs.unlink(TOKEN_FILE)
    return true;
  } catch (error) {
    return false; // File doesn't exist or can't be deleted
  }
}

export async function isTokenExpired() {
  const token = await getStoredToken()
  
  if(!token || !token.expires_at){
    return true;
  }

  const expiresAt = new Date(token.expires_at)
  const now = new Date()

  // Consider expired if less than 5 minutes remaining
  return expiresAt.getTime() - now.getTime() < 5*60*1000
}

export async function requireAuth(){
  const token = await getStoredToken()

  if(!token){
    console.log(
      chalk.red("❌ Not authenticated. Please run 'star-cli' first.")
    )
    process.exit(1)
  }

  if(await isTokenExpired()){
    console.log(
      chalk.yellow("⚠️ Your session has expired. Please login again.")
    )
    console.log(chalk.gray("Run: star login\n"))
    process.exit(1)
  }

  return token
}