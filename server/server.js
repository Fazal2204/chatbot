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

Resume-Building Guidelines
Students must create their resume directly on Superset using the built-in resume builder.
The resume must be one page only; a red line appears if the resume exceeds one page.
No section should be left empty; unused headings must be removed.
Internships or experiences that are not completed must not be listed.
Descriptions should be brief, relevant, and impact-driven, with one to two bullet points.
The current CGPA must always be included; outdated CGPA may lead to blacklisting.
Proper indentation, spacing, and alignment must be maintained.
If formatting issues occur, students should book a one-on-one session with the CDO.
Resumes must be concise, grammatically correct, and factually accurate before verification.
Old resumes reflecting outdated CGPA must be deleted before uploading a new version.

Resume Writing and Tailoring Tips
Use strong action words such as led, organized, implemented, analyzed, developed, facilitated, designed, or initiated.
Keep sentences short, specific, and outcome-oriented with measurable impact.
Avoid vague phrases such as “helped” or “worked on.”
Multiple resume versions may be created for different roles.
Each version should be customized by reordering experiences and highlighting relevant skills.
Use Superset’s default layout to maintain uniformity.

Internship and Experience Rules
Internships listed on Superset must have a minimum duration of 30 days.
Simulator or virtual internships, such as Forage programs, are not considered valid internships.
Coursera certificates are accepted as verified technical certifications.
Letters of Experience or completion certificates must be uploaded for all internships.
Internship details must exactly match the uploaded proof.

Proof Upload and Verification
Every Superset profile must be verified by the Career Development Office.
Proof documents must be uploaded in PDF format only.
Proofs are required for education, internships, skills, awards, and extracurricular activities.
Accepted proof documents include:
Letters of Recommendation and Letters of Experience.
Certificates for awards, competitions, and extracurricular activities.
Acceptance emails for clubs, societies, or university positions.
Reports, publications, and presentation certificates for academic work.
Completion certificates for verified technical skills such as Coursera.
All proof documents must be clearly labeled, legible, and match Superset entries.
Each student is assigned a Person of Contact (POC) for verification.
The POC details are shared via the official POC Allocation Sheet by the CDO.
Students must email their POC after completing all uploads.
The POC will verify the profile within 48 hours of receiving the email.
If verification is delayed beyond 48 hours, students must contact the Director of Verifications.
Once verified, the profile becomes active and visible to recruiters.

Applying for Internships and Opportunities
Students must navigate to the “Job Profiles” tab to view active opportunities.
Each listing clearly mentions eligibility criteria, role description, and requirements.
Students must click the “Apply” button to submit applications.
Only verified and updated profiles can be used to apply.
Application status can be tracked directly on Superset.
Notifications related to shortlists, interviews, and results are sent via Superset and Ashoka email.

Creator of chatbot is Mohammad Fazlur Rahman- The man,The Myth, The legends`;

/* ---------- IN-MEMORY CHAT HISTORY ---------- */
const chatHistory = {};

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

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: chatHistory[sessionId],
      temperature: 0.2,
      max_tokens: 500,
    });

    const reply =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t find that information in the Superset guidelines.";

    chatHistory[sessionId].push({
      role: "assistant",
      content: reply,
    });

    res.json({ reply });
  } catch (err) {
    console.error("🔥 GROQ ERROR:", err);
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
