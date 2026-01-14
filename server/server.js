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

/* 🚨 TEMPORARY: ALLOW ALL ORIGINS (DEBUG MODE) */
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const supersetDoc = `
Internship Preparation Program (IPP) is mandatory before Superset access.
Superset is Ashoka University’s official internship and placement platform.
`;

const chatHistory = {};

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post("/api/chat", async (req, res) => {
  console.log("📩 Incoming request:", req.body);

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "Missing message or sessionId" });
    }

    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        `Answer ONLY using this document:\n${supersetDoc}`
      ];
    }

    chatHistory[sessionId].push(`User: ${message}`);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: chatHistory[sessionId].join("\n") }] }]
    });

    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error("🔥 BACKEND ERROR:", err);
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
