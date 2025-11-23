import express from "express"
import dotenv from "dotenv"
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";

dotenv.config()

const app = express()

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

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
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`)
})


app.listen(process.env.PORT, () => {
  console.log(`Application started running on PORT ${process.env.PORT}`);
})