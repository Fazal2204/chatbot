import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

/* ✅ GEMINI PRO (YOU HAVE QUOTA FOR THIS) */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-pro"
});

const supersetDoc = `
Internship Preparation Program (IPP) is mandatory before Superset access.
Superset is Ashoka University’s official internship & placement platform.
Resume must be one page and verified.
Minimum internship duration is 30 days.
`;

const chatHistory = {};

app.get("/", (req, res) => {
  res.send("Superset chatbot backend running");
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "message and sessionId are required"
      });
    }

    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        `Answer ONLY using the document below:\n${supersetDoc}`
      ];
    }

    chatHistory[sessionId].push(`User: ${message}`);
    const prompt = chatHistory[sessionId].join("\n");

    const result = await model.generateContent(prompt);

    const reply =
      result?.response?.text()?.trim() ||
      "Sorry, I could not generate a response.";

    chatHistory[sessionId].push(`Assistant: ${reply}`);
    res.json({ reply });
  } catch (err) {
    console.error("🔥 GEMINI ERROR:", err);

    if (err.status === 429) {
      return res.status(429).json({
        error: "AI is busy. Please wait a minute and try again."
      });
    }

    res.status(500).json({
      error: "Backend failed",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
