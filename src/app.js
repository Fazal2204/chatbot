import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import "./index.css";

/* ✅ BACKEND URL (Render) */
const API_BASE = "https://superset-chatbot-backend.onrender.com";

function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hey! 👋 I'm the Superset Help Assistant. Ask me anything about IPP, resumes, or internships."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}`);

  /* Auto-scroll */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;

    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/chat`,
        {
          message: userText,
          sessionId: sessionId.current
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000
        }
      );

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: response.data.reply || "No response received."
        }
      ]);
    } catch (error) {
      console.error("❌ Frontend API error:", error);

      let errorMsg = "Something went wrong. Please try again.";

      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.request) {
        errorMsg = "Cannot reach server. Please try again later.";
      }

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `⚠️ ${errorMsg}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="page">
      <div className="header">
        <h1>Superset Help Assistant 💬</h1>
        <p>Your guide to internships, IPP, and placements</p>
      </div>

      <div className="chat-box" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="msg bot">Typing...</div>}
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something about Superset or IPP..."
        />
        <button onClick={sendMessage} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default App;
