import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

/* ---------- ENV CHECK ---------- */
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing");
  process.exit(1);
}

/* ---------- APP SETUP ---------- */
const app = express();
app.use(cors());
app.use(express.json());

/* ---------- OPENAI CLIENT ---------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------- CONTEXT DOCUMENT ---------- */
const supersetDoc = `
Internship Preparation Program (IPP)
• IPP is mandatory before Superset access.
• Superset is Ashoka University’s official internship & placement platform.
• Resume must be one page and verified.
• Minimum internship duration is 30 days.
• Coursera certificates are accepted.
• Verification takes up to 48 hours.
`;

/* ---------- SESSION MEMORY ---------- */
const chatHistory = {};

/* ---------- ROUTES ---------- */

// Root
app.get("/", (req, res) => {
  res.send("✅ Superset Chatbot Backend (OpenAI) running");
});

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", provider: "openai" });
});

// Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "message and sessionId are required",
      });
    }

    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        {
          role: "system",
          content:
            "You are an assistant for Ashoka University students. " +
            "Answer ONLY using the following document:\n\n" +
            supersetDoc,
        },
      ];
    }

    chatHistory[sessionId].push({
      role: "user",
      content: message,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatHistory[sessionId],
      temperature: 0.2,
    });

    const reply = completion.choices[0].message.content.trim();

    chatHistory[sessionId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply });
  } catch (err) {
    console.error("🔥 OPENAI ERROR:", err);

    if (err.status === 429) {
      return res.status(429).json({
        error: "AI is busy. Please wait and try again.",
      });
    }

    res.status(500).json({
      error: "Backend failed",
      details: err.message,
    });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
