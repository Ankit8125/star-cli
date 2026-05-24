import express from "express"
import dotenv from "dotenv"
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";
import { ChatService } from "./service/chat.service.js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateObject } from "ai";
import { z } from "zod";

dotenv.config()

const app = express()
const chatService = new ChatService()

// Initialize Google Gemini provider on the server
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
});
const defaultModel = googleProvider(process.env.STAR_MODEL || "gemini-2.5-flash");

app.use(
  cors({
    origin: true, // Allow all origins during development and production testing
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Secure session middleware
const requireSession = async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = session.user.id;
  req.user = session.user;
  next();
};

app.use("/health", (req, res) => {
  res.send("Status: Working...")
})

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

app.get("/device", async(req, res) => {
  const { user_code } = req.query
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"
  res.redirect(`${frontendUrl}/device?user_code=${user_code}`)
})

// === Secure SaaS API Endpoints ===

// GET /api/conversations - Get all conversations of a user
app.get("/api/conversations", requireSession, async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations - Create a conversation
app.post("/api/conversations", requireSession, async (req, res) => {
  const { mode, title } = req.body;
  try {
    const conversation = await chatService.createConversation(req.userId, mode, title);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/:id/messages - Get messages in a conversation
app.get("/api/conversations/:id/messages", requireSession, async (req, res) => {
  const { id } = req.params;
  try {
    const messages = await chatService.getMessages(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/conversations/:id/messages - Add message to a conversation
app.post("/api/conversations/:id/messages", requireSession, async (req, res) => {
  const { id } = req.params;
  const { role, content } = req.body;
  try {
    const message = await chatService.addMessage(id, role, content);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/conversations/:id/title - Update conversation title
app.put("/api/conversations/:id/title", requireSession, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    const conversation = await chatService.updateTitle(id, title);
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/conversations/:id - Delete a conversation
app.delete("/api/conversations/:id", requireSession, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await chatService.deleteConversation(id, req.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chat/stream - Secure AI streaming using server credentials
app.post("/api/chat/stream", requireSession, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const result = streamText({
      model: defaultModel,
      messages: messages,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of result.textStream) {
      res.write(chunk);
    }
    
    res.end();
  } catch (error) {
    console.error("Server AI stream error:", error.message);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
// Define the structured schema for Agentic application generation
const ApplicationSchema = z.object({
  folderName: z.string().describe("Star-Case folder name for the application"),
  description: z.string().describe("Brief description of what was created"),
  files: z.array(
    z.object({
      path: z.string().describe("Relative file path (ex: src/App.jsx)"),
      content: z.string().describe("Complete File Content")
    }).describe("All files needed for the application")
  ),
  setupCommands: z.array(
    z.string().describe("Bash commands to setup and run (ex: npm install, npm run dev)")
  )
})

// POST /api/chat/structured - Secure structured AI application generation using server credentials
app.post("/api/chat/structured", requireSession, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const result = await generateObject({
      model: defaultModel,
      schema: ApplicationSchema,
      prompt: prompt,
    });
    res.json(result.object);
  } catch (error) {
    console.error("Server AI structured error:", error.message);
    res.status(500).json({ error: "Failed to generate structured application" });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Application started running on PORT ${process.env.PORT || 5000}`);
})