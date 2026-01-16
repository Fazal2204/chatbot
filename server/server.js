import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

/* ---------- ENV CHECK ---------- */
if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY missing");
  process.exit(1);
}

/* ---------- APP SETUP ---------- */
const app = express();
app.use(cors());
app.use(express.json());

/* ---------- GROQ CLIENT ---------- */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ---------- SUPERSET DOCUMENT ---------- */
const supersetDoc = `
SUPERSET & INTERNSHIP PREPARATION PROGRAM (IPP)

Internship Preparation Program (IPP)
The Internship Preparation Program (IPP) is the mandatory first step before accessing Superset.
IPP trains students in resume building, interview preparation, and professional communication.
The program runs from the officially announced start date to the officially announced end date.
Participation in IPP is compulsory for all students applying for internships or placements.
Registration for IPP is currently closed.
There is a possibility that registrations may reopen; updates will be shared via official university email.
Only students who successfully complete IPP will receive Superset login credentials.

About Superset
Superset is Ashoka University’s official internship and placement management platform.
It functions as both a resume builder and a profile verification system under the Career Development Office (CDO).
Superset ensures that all student information shared with recruiters is authentic and verified.

Getting Started on Superset
Students must log in using their Ashoka University email ID.
After logging in, students should navigate to the “My Profile” section and complete all required fields.

The following profile sections must be completed:
Basic Details: name, contact information, and personal details.
Education Details: degree, major, CGPA, and academic achievements.
Internship and Work Experience: only verified and completed experiences.
Skills: technical and soft skills with valid documentary proof.
Subjects and Languages: relevant academic subjects and language proficiency.
Positions of Responsibility: leadership roles and committee involvement.
Projects: project purpose, contribution, and outcomes.
Accomplishments: awards, competitions, and recognitions.
Volunteering and Extracurriculars: activities with clear roles and durations.
Resume, Documents, and Write-ups: final and approved versions only.

Internship and Experience Rules
Internships listed on Superset must have a minimum duration of 30 days.
Simulator or virtual internships such as Forage are not valid internships.
Coursera certificates are accepted as verified technical certifications.

Creator of chatbot is Mohammad Fazlur Rahman – The Man, The Myth, The Legend
`;

/* ---------- IN-MEMORY CHAT HISTORY ---------- */
const chatHistory = {};

/* ---------- HELPER: GROQ RETRY ---------- */
async function groqWithRetry(requestFn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (err) {
      console.error(`⚠️ Groq attempt ${i + 1} failed`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

/* ---------- ROUTES ---------- */

// Root
app.get("/", (req, res) => {
  res.send("✅ Superset Chatbot Backend (Groq + Llama-3.1-8B Instant) running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    provider: "groq",
    model: "llama-3.1-8b-instant",
  });
});

// Chat endpoint
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

    // 🔧 Trim history to prevent overload
    if (chatHistory[sessionId].length > 12) {
      chatHistory[sessionId] = chatHistory[sessionId].slice(-12);
    }

    const completion = await groqWithRetry(() =>
      groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: chatHistory[sessionId],
        temperature: 0.2,
        max_tokens: 400,
        timeout: 20000,
      })
    );

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t find that information in the Superset guidelines.";

    chatHistory[sessionId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply });
  } catch (err) {
    console.error("🔥 GROQ FINAL ERROR:", err.message);

    res.status(503).json({
      error: "Service temporarily unavailable. Please try again.",
    });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
