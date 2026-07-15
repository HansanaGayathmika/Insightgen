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
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary-container text-lg">smart_toy</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface leading-tight">What Should I Do?</h3>
          <p className="text-xs text-on-surface-variant">AI assistant for this dataset</p>
        </div>
      </div>

      <p className="text-sm text-on-surface-variant mb-4">
        Ask anything about this dataset — e.g. <span className="italic">"Which column should I drop?"</span> or <span className="italic">"How can I improve data quality?"</span>
      </p>

      {/* Message history */}
      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-1">
          {messages.map((msg, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
                  {msg.question}
                </div>
              </div>
              <div className="flex justify-start items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-on-primary-container text-[14px]">smart_toy</span>
                </div>
                <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm leading-relaxed">
                  {msg.answer}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary-container text-[14px]">smart_toy</span>
              </div>
              <div className="bg-surface-container-low rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your data..."
          className="w-full pl-4 pr-24 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">send</span>
          Ask
        </button>
      </div>
    </div>
  );
}

export default Chat;