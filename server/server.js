// ✅ server.js — Superset Chatbot Backend using Gemini 2.5 Flash
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

dotenv.config();

// ✅ Check for API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env file");
  process.exit(1);
}
console.log("✅ GEMINI_API_KEY loaded successfully");

// ✅ Express setup
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

// ✅ Gemini client (Gemini 2.5 Flash)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 📄 Superset + IPP Document Context (full version)
const supersetDoc = `
Internship Preparation Program (IPP)
• The Internship Preparation Program (IPP) is the first step before accessing Superset.
• IPP trains students in resume building, interview preparation, and professional communication.
• The program runs from [Start Date] to [End Date].
• Participation in IPP is mandatory for all students applying for internships or placements.
• Registration for IPP is currently closed. There is a possibility that registrations may reopen — updates will be shared via university email.
• Only students who complete IPP successfully will receive Superset login credentials.

About Superset
• Superset is Ashoka University’s official internship and placement management platform.
• It acts as both a resume builder and a profile verification system under the Career Development Office (CDO).
• Superset ensures that all student information shared with recruiters is authentic and verified.

Getting Started on Superset
• Log in using your Ashoka University email ID.
• Navigate to “My Profile” and fill out all required sections completely.
• Complete sections like Basic Details, Education Details, Internship & Work Experience, Skills, Subjects and Languages, Positions of Responsibility, Projects, Accomplishments, Volunteering & Extracurriculars, and Resume Uploads.
• Resume must be one page, concise, grammatically correct, and factually accurate.
• Upload proof documents — CDO verifies them within 48 hours.

Resume-Building Guidelines
• Create your resume directly on Superset using the built-in resume builder.
• Do not list unverified or incomplete experiences.
• Maintain proper indentation, spacing, and alignment.
• Include your current CGPA only — outdated CGPA may lead to blacklisting.
• Use strong action words like led, designed, implemented, developed, etc.
• Keep sentences short and outcome-based.

Internship and Experience Rules
• Each internship must have a minimum duration of 30 days.
• Simulator or virtual experience programs (like Forage) do not count.
• Coursera certificates count as verified technical certifications.
• Upload LOEs or completion certificates for all valid internships.

Proof Upload & Verification
• Proofs are mandatory for education, internships, skills, awards, and extracurriculars.
• Accepted proofs: LORs, LOEs, certificates, acceptance emails, publications, reports, etc.
• Each student has a Person of Contact (POC) for verification.
• Email your POC after uploading all proofs — verification occurs within 48 hours.
• Contact the Director of Verifications if pending beyond 48 hours.

Applying for Internships & Opportunities
• Use the “Job Profiles” tab on Superset to view and apply.
• Ensure your resume and profile are verified before applying.
• Notifications about shortlists and results are sent via Superset and Ashoka email.

Additional Notes
• IPP completion is required before Superset access.
• Resume must be updated regularly — outdated information leads to profile deactivation.
• Proofs must be uploaded in PDF format only.
• Inconsistent details between resume and proofs may delay verification.
`;

// 🧠 Chat history store (per session)
const chatHistory = {};

// 🧾 Log folder setup
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
const logFile = path.join(logDir, "chat_history.log");

// 🧩 Utility: log chat to file
function logChat(sessionId, userMsg, aiReply) {
  const logEntry = `[${new Date().toLocaleString()}] (Session: ${sessionId})
User: ${userMsg}
AI: ${aiReply}
--------------------------------------------------\n`;
  fs.appendFileSync(logFile, logEntry);
}

// ✅ Root route
app.get("/", (req, res) => {
  res.send("✅ Superset Chatbot Backend (Gemini 2.5 Flash) running successfully!");
});

// 🩺 Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.5-flash",
    serverTime: new Date().toISOString(),
  });
});

// 🧠 Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message and sessionId are required." });
    }

    // Initialize session history
    if (!chatHistory[sessionId]) {
      chatHistory[sessionId] = [
        `You are an AI assistant for Ashoka University students.

Answer ONLY based on the following document:

${supersetDoc}

Rules:
1. If the question is NOT related to Superset, IPP, resume building, or internships at Ashoka University, say:
   "I can only answer questions related to Superset or the Internship Preparation Program (IPP) at Ashoka University."
2. Keep answers short, clear, and factual.
3. Do not hallucinate or invent new policies.
4. If the document doesn’t mention something, say you don’t have that information.
`,
      ];
    }

    chatHistory[sessionId].push(`User: ${message}`);
    const prompt = chatHistory[sessionId].join("\n");

    // ✅ Generate AI response
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const reply = result.response.text().trim() || "Sorry, I couldn’t generate a response.";
    chatHistory[sessionId].push(`Assistant: ${reply}`);

    // ✅ Log conversation
    logChat(sessionId, message, reply);

    res.json({ reply });
  } catch (err) {
    console.error("❌ Error generating Gemini reply:", err);
    res.status(500).json({
      error: "Failed to generate AI response.",
      details: err.message || err,
    });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Superset Chatbot Server (Gemini 2.5 Flash) running at http://localhost:${PORT}`);
});
