// listModels.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1/models?key=" + process.env.GEMINI_API_KEY
    );
    const data = await response.json();
    console.log("✅ Available Models:");
    data.models.forEach(m => console.log("-", m.name));
  } catch (err) {
    console.error("❌ Error fetching model list:", err);
  }
}

listModels();

