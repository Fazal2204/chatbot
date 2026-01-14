// Superset Chatbot Backend using Gemini 2.5 Flash

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
  ✅ FIXED CORS CONFIG FOR GITHUB PAGES
  GitHub Pages origin is ALWAYS https://<username>.github.io
  (repo name does NOT matter for origin)
*/
app.use(
  cors({
    origin: [
      "https://Fazal2204.github.io",
      "https://fazal2204.github.io"
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  })
);

app.use(express.json());

/* -------------------- GEMINI SETUP -------------------- */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});

/* -------------------- DOCUMENT CONTEXT -------------------- */
const supersetDoc = `
Internship Preparation Program (IPP)
• IPP is mandatory before accessing Superset.
• Superset is Ashoka University’s internship & placement platform.
• Only verified data is shared with recruiters.
• Resume must be one page and factually correct.
• Minimum internship duration: 30 days.
• Coursera certificates are allowed.
• Proof verification takes up to 48 hours.
`;

/* -------------------- CHAT MEMORY -------------------- */
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
    model: "gemini-2.5-flash",
    time: new Date().toISOString()
  });
});

// Chat API
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
        `You are an AI assistant for Ashoka University students.
Answer ONLY using this document:

${supersetDoc}

Rules:
1. Only answer Superset/IPP related queries.
2. Be factual and concise.
3. If information is missing, say so.`
      ];
    }

    chatHistory[sessionId].push(`User: ${message}`);
    const prompt = chatHistory[sessionId].join("\n");

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const reply =
      result.response.text()?.trim() ||
      "Sorry, I could not generate a response.";

    chatHistory[sessionId].push(`Assistant: ${reply}`);

    res.json({ reply });
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({
      error: "Failed to generate response"
    });
  }
});

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
