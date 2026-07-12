import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function Chat({ analysisId }) {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]); // { question, answer }
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || !analysisId) return;

    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post(
        `http://localhost:3000/chat/${analysisId}`,
        { question: currentQuestion, chat_history: messages },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [
        ...prev,
        { question: currentQuestion, answer: res.data.answer }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { question: currentQuestion, answer: "Something went wrong. Try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="card">
      <h2>💬 What Should I Do?</h2>
      <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "-0.5rem" }}>
        Ask anything about this dataset — e.g. "Which column should I drop?" or "How can I improve data quality?"
      </p>

      <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: "1rem" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.3rem" }}>You: {msg.question}</div>
            <div style={{
              background: "#eef1ff",
              borderLeft: "4px solid #4f46e5",
              padding: "0.6rem 1rem",
              borderRadius: "6px"
            }}>
              {msg.answer}
            </div>
          </div>
        ))}
        {loading && <p style={{ color: "#666" }}>Thinking...</p>}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data..."
          style={{ flex: 1, padding: "0.6rem", borderRadius: "8px", border: "1px solid #ddd" }}
        />
        <button onClick={handleAsk} disabled={loading || !question.trim()}>
          Ask
        </button>
      </div>
    </div>
  );
}

export default Chat;