import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function healthBadge(missingPct) {
  if (missingPct === 0) return { label: "Excellent", color: "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant", dot: "bg-tertiary-fixed-dim" };
  if (missingPct < 10) return { label: "Good", color: "bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant", dot: "bg-tertiary-fixed-dim" };
  if (missingPct < 25) return { label: "Warning", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" };
  return { label: "Critical", color: "bg-error-container text-error", dot: "bg-error" };
}

function typeIcon(datatype) {
  if (datatype.includes("int") || datatype.includes("float")) return "pin";
  if (datatype.includes("date")) return "calendar_today";
  return "text_snippet";
}

function ColumnDetails({ result, token }) {
  const [showAll, setShowAll] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center text-on-surface-variant">
        Upload a dataset first to see column details.
      </div>
    );
  }

  const totalRows = result.rows;
  const columnsWithMissing = result.column_details.map((col) => ({
    ...col,
    missingPct: totalRows > 0 ? (col.missing_values / totalRows) * 100 : 0
  }));

  const visibleColumns = showAll ? columnsWithMissing : columnsWithMissing.slice(0, 4);

  // Quality insights: pull skewed + high-cardinality alerts
  const qualityAlerts = (result.eda.alerts || []).filter(
    (a) => a.type === "Skewed" || a.type === "Unique" || a.type === "Constant"
  );

  // First numeric histogram for the mini chart
  const numericChartEntry = Object.entries(result.eda.charts || {}).find(
    ([_, chart]) => chart.type === "histogram"
  );

  const handleAsk = async () => {
    if (!question.trim() || !result.analysisId) return;
    const currentQuestion = question;
    setQuestion("");
    setChatLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:3000/chat/${result.analysisId}`,
        { question: currentQuestion, chat_history: chatMessages },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages((prev) => [...prev, { question: currentQuestion, answer: res.data.answer }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { question: currentQuestion, answer: "Something went wrong." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-outline mb-2">
            <span className="material-symbols-outlined text-sm">database</span>
            <span className="text-xs uppercase tracking-widest">{result.filename || "uploaded_dataset.csv"}</span>
          </div>
          <h2 className="text-3xl font-bold text-on-surface">Data Quality & Column Details</h2>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Schema table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-outline-variant/30">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">table_rows</span>
                Schema Analysis
              </h3>
              <span className="px-3 py-1 bg-surface-container rounded-full text-xs text-primary font-bold">
                {result.columns} COLUMNS
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-xs text-outline uppercase font-bold">Column Name</th>
                    <th className="px-6 py-4 text-xs text-outline uppercase font-bold">Type</th>
                    <th className="px-6 py-4 text-xs text-outline uppercase font-bold">Missing (%)</th>
                    <th className="px-6 py-4 text-xs text-outline uppercase font-bold">Unique</th>
                    <th className="px-6 py-4 text-xs text-outline uppercase font-bold text-right">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {visibleColumns.map((col, i) => {
                    const badge = healthBadge(col.missingPct);
                    return (
                      <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-xl">
                              {typeIcon(col.datatype)}
                            </span>
                            <span className="font-bold text-on-surface">{col.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-2 py-1 bg-surface-container rounded text-xs font-mono">
                            {col.datatype.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-6 py-5 ${col.missingPct > 0 ? "text-error font-semibold" : "text-on-surface-variant"}`}>
                          {col.missingPct.toFixed(1)}%
                        </td>
                        <td className="px-6 py-5 text-on-surface-variant">{col.unique_values.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {columnsWithMissing.length > 4 && (
              <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                >
                  {showAll ? "Show Less" : "View All Columns"}
                  <span className="material-symbols-outlined text-sm">
                    {showAll ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quality Insights */}
          <div className="bg-white rounded-xl shadow-md border border-outline-variant/30">
            <div className="px-6 py-5 border-b border-outline-variant/30">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">insights</span>
                Quality Insights
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {qualityAlerts.length === 0 && (
                <p className="text-sm text-on-surface-variant col-span-2">No notable quality issues found beyond the schema table.</p>
              )}
              {qualityAlerts.map((alert, i) => (
                <div key={i} className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">info</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm mb-1">{alert.type}: '{alert.column}'</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* What Should I Do panel */}
          <div className="bg-[#0b1c30] rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-tertiary-fixed-dim flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-sm">smart_toy</span>
              </div>
              <h3 className="font-bold text-lg">What Should I Do?</h3>
            </div>

            {chatMessages.length === 0 ? (
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                Ask a question below, or try one of the suggested actions.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto custom-scrollbar mb-4 space-y-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className="text-xs">
                    <p className="text-white/50 mb-1">You: {m.question}</p>
                    <p className="text-white/90 bg-white/10 rounded-lg p-2">{m.answer}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {(result.suggestions || []).slice(0, 2).map((s, i) => {
                const suggestionText = typeof s === "object" && s !== null ? s.suggested_fix : s;
                return (
                  <button
                    key={i}
                    onClick={() => setQuestion(suggestionText)}
                    className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 transition-colors"
                  >
                    <p className="text-xs text-white/80">{suggestionText}</p>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-tertiary-fixed-dim"
                placeholder="Ask anything about this dataset..."
              />
              <button
                onClick={handleAsk}
                disabled={chatLoading || !question.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-tertiary-fixed-dim flex items-center justify-center text-[#0b1c30] disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>

          {/* Numeric distribution mini chart */}
          {numericChartEntry && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-outline-variant/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-on-surface">Numeric Distribution</h3>
                <span className="text-xs text-outline font-medium">{numericChartEntry[0]}</span>
              </div>
              <div className="h-40 flex items-end gap-1 px-2">
                {numericChartEntry[1].counts.map((count, i) => {
                  const max = Math.max(...numericChartEntry[1].counts);
                  const heightPct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 rounded-t hover:bg-primary transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${count}`}
                    ></div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-outline font-bold">
                <span>{numericChartEntry[1].bins[0]}</span>
                <span>{numericChartEntry[1].bins[numericChartEntry[1].bins.length - 1]}</span>
              </div>
            </div>
          )}

          {/* Correlation grid */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-outline-variant/30">
            <h3 className="font-bold text-on-surface mb-4">Feature Correlations</h3>
            {result.eda.correlations.strong_pairs.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No strong correlations detected.</p>
            ) : (
              <div className="space-y-2">
                {result.eda.correlations.strong_pairs.map((pair, i) => (
                  <div key={i} className="flex justify-between items-center text-xs bg-surface-container-low rounded-lg px-3 py-2">
                    <span className="text-on-surface-variant">{pair.column_a} ↔ {pair.column_b}</span>
                    <span className={`font-bold ${pair.correlation > 0 ? "text-green-600" : "text-error"}`}>
                      {pair.correlation}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColumnDetails;
