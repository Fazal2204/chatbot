// Superset Chatbot Backend — FINAL STABLE VERSION
// Gemini Flash (SDK-correct model ID)

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

/* -------------------- ENV CHECK -------------------- */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

/* -------------------- EXPRESS SETUP -------------------- */
const app = express();

/*
  DEBUG-SAFE CORS
  (You can lock this later, but keep it open until stable)
*/
app.use(cors());
app.use(express.json());

/* -------------------- GEMINI SETUP -------------------- */
/*
  IMPORTANT:
  Marketing name: "Gemini 2.5 Flash"
  ACTUAL SDK MODEL ID: "gemini-2.0-flash"
*/
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});

/* -------------------- CONTEXT -------------------- */
const supersetDoc = `
Internship Preparation Program (IPP)
• IPP is mandatory before accessing Superset.
• Superset is Ashoka University’s official internship & placement platform.
• Only verified data is shared with recruiters.
• Resume must be one page and factually correct.
• Minimum internship duration is 30 days.
• Coursera certificates are accepted.
• Verification takes up to 48 hours.
`;

/* -------------------- SESSION MEMORY -------------------- */
const chatHistory = {};

/* -------------------- ROUTES -------------------- */

// Root
app.get("/", (req, res) => {
  res.send("✅ Superset Chatbot Backend is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.0-flash",
    time: new Date().toISOString()
  });
});

// Chat API
app.post("/api/chat", async (req, res) => {
  console.log("📩 Incoming request:", req.body);

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "message and sessionId are required"
      });
    }

    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        `You are an AI assistant for Ashoka University students.
Answer ONLY using the document below:

${supersetDoc}

Rules:
1. Only answer Superset / IPP related queries.
2. Be factual and concise.
3. Do not invent policies.
4. If information is missing, say so.`
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

    res.status(500).json({
      error: "Backend failed",
      details: err.message
    });
  }
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
