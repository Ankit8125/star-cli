import express from "express"
import dotenv from "dotenv"

dotenv.config()

const app = express()

app.use("/health", (req, res) => {
  res.send("Status: Working...")
})

app.listen(process.env.PORT, () => {
  console.log(`Application started running on PORT ${process.env.PORT}`);
})