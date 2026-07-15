import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function FloatingChat({ analysisId }) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
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
      setMessages((prev) => [...prev, { question: currentQuestion, answer: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { question: currentQuestion, answer: "Something went wrong. Try again." }]);
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

  if (!analysisId) return null;

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 group"
        >
          <span className="bg-white text-on-surface text-sm font-semibold px-4 py-2 rounded-full shadow-lg border border-outline-variant opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AI Assist
          </span>
          <span className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-secondary to-purple-400 shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-3xl">smart_toy</span>
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-secondary px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
              </span>
              <div>
                <p className="text-white font-bold text-sm leading-tight">InsightGen AI</p>
                <p className="text-white/70 text-xs">What should I do?</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          {!started ? (
            <div className="flex-1 bg-gradient-to-br from-primary/90 via-secondary/70 to-yellow-200/60 flex flex-col items-center justify-center text-center px-8 gap-4">
              <h2 className="text-white text-4xl font-bold drop-shadow-sm">Hello</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Hi, I'm your AI Assistant! Ask me anything about this dataset — data quality, patterns, or what to do next.
              </p>
              <button
                onClick={() => setStarted(true)}
                className="mt-2 bg-white text-primary font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
              >
                Start Chat
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4 bg-surface-container-low">
                {messages.length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center mt-4">
                    Try: "Which column should I drop?" or "How can I improve data quality?"
                  </p>
                )}
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
                      <div className="bg-white text-on-surface rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm leading-relaxed shadow-sm">
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
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-outline-variant bg-white shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    className="w-full pl-4 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default FloatingChat;