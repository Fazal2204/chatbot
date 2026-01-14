// Superset Chatbot Backend using Gemini 2.5 Flash

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

dotenv.config();

/* -------------------- ENV CHECK -------------------- */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

/* -------------------- EXPRESS SETUP -------------------- */
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
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
• The Internship Preparation Program (IPP) is the first step before accessing Superset.
• IPP trains students in resume building, interview preparation, and professional communication.
• Participation in IPP is mandatory for internships and placements.
• Only students who complete IPP successfully receive Superset login credentials.

About Superset
• Superset is Ashoka University’s official internship and placement management platform.
• It is managed by the Career Development Office (CDO).
• All recruiter-facing data is verified.

Resume Rules
• Resume must be one page.
• Only verified experiences allowed.
• Incorrect or outdated CGPA may lead to blacklisting.

Internships
• Minimum duration: 30 days.
• Virtual simulators do not count.
• Coursera certificates are allowed.

Verification
• Proofs are mandatory.
• Verification takes up to 48 hours.
• Inconsistencies delay approval.
`;

/* -------------------- CHAT MEMORY -------------------- */
const chatHistory = {};

/* -------------------- LOGGING (SAFE FOR RENDER) -------------------- */
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, "chat_history.log");

function logChat(sessionId, userMsg, aiReply) {
  const entry = `
[${new Date().toISOString()}]
Session: ${sessionId}
User: ${userMsg}
AI: ${aiReply}
--------------------------------------
`;
  fs.appendFileSync(logFile, entry);
}

/* -------------------- ROUTES -------------------- */

// Root
app.get("/", (req, res) => {
  res.send("✅ Superset Chatbot Backend is running");
});

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.5-flash",
    time: new Date().toISOString()
  });
});

// Chat
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
Answer ONLY using the following document:

${supersetDoc}

Rules:
1. If unrelated, say you can only answer Superset/IPP questions.
2. Be factual and concise.
3. Do not invent policies.
4. If not mentioned, say you do not have that information.`
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
    logChat(sessionId, message, reply);

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
