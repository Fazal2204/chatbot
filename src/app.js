import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import "./index.css";

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

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { sender: "user", text: input }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/chat`,
        {
          message: input,
          sessionId: sessionId.current
        },
        {
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: response.data.reply }
      ]);
    } catch (error) {
      console.error("❌ API ERROR:", error);

      let errorText = "Unknown error";

      if (error.response) {
        // Backend responded with error
        errorText = `Error ${error.response.status}: ${
          error.response.data?.error ||
          JSON.stringify(error.response.data)
        }`;
      } else if (error.request) {
        // Request sent but no response (CORS / network)
        errorText = "No response from backend (network or CORS issue)";
      } else {
        errorText = error.message;
      }

      setMessages(prev => [
        ...prev,
        { sender: "bot", text: `⚠️ ${errorText}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !isLoading) sendMessage();
  };

  return (
    <div className="page">
      <div className="header">
        <h1>Superset Help Assistant 💬</h1>
        <p>Your guide to internships, IPP, and placements at Ashoka University</p>
      </div>

      <div className="chat-box" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && <div className="msg bot typing">...</div>}
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me something about Superset or IPP..."
        />
        <button onClick={sendMessage} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export default App;
