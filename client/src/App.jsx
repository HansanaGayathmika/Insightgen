import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { useAuth } from "./AuthContext";
import Auth from "./Auth";
import History from "./History";
import Chat from "./Chat";
import "./App.css";

function alertColor(type) {
  const colors = {
    "Constant": "#f5b800",
    "Outliers": "#f97316",
    "Missing": "#dc2626",
    "Duplicates": "#dc2626",
    "Unique": "#dc2626",
    "Skewed": "#8b5cf6",
    "High correlation": "#6b7280"
  };
  return colors[type] || "#6b7280";
}

function App() {
  const { token, email, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("upload"); // "upload" or "history"
  const [story, setStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);

  // 🔒 Show login/register screen if not logged in
  if (!token) {
    return <Auth />;
  }

  const handleGenerateStory = async () => {
    if (!result?.analysisId) return;
    setStoryLoading(true);
    setStory(null);

    try {
      const res = await axios.post(
        `http://localhost:3000/story/${result.analysisId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStory(res.data.story);
    } catch (err) {
      setStory("Failed to generate story.");
    } finally {
      setStoryLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);
    setStory(null);

    try {
      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header" style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.8rem" }}>📊</span>
          <h1>InsightGen</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => setView("upload")}>New Upload</button>
          <button onClick={() => setView("history")}>History</button>
          <span style={{ color: "#666" }}>{email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </div>

      {view === "history" && (
        <History onSelect={(data) => { setResult(data); setView("upload"); }} />
      )}

      {view === "upload" && (
        <>
          <div className="upload-bar">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={handleUpload} disabled={!file || loading}>
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </button>
            {error && <span className="error-text">{error}</span>}
          </div>

          {loading && (
            <>
              <div className="card">
                <div className="skeleton skeleton-line" style={{ width: "40%" }} />
                <div className="skeleton skeleton-card" />
              </div>
              <div className="card">
                <div className="skeleton skeleton-line" style={{ width: "30%" }} />
                <div className="skeleton skeleton-line" style={{ width: "90%" }} />
                <div className="skeleton skeleton-line" style={{ width: "80%" }} />
              </div>
            </>
          )}

          {!loading && result && (
            <>
              {result.eda.alerts && result.eda.alerts.length > 0 && (
                <div className="card">
                  <h2>🚨 Alerts ({result.eda.alerts.length})</h2>
                  <table>
                    <tbody>
                      {result.eda.alerts.map((alert, i) => (
                        <tr key={i}>
                          <td>
                            {alert.column && <code>{alert.column}</code>}{" "}
                            {alert.column ? alert.message.replace(alert.column, "").trim() : alert.message}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span style={{
                              background: alertColor(alert.type),
                              color: "white",
                              padding: "0.2rem 0.6rem",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}>
                              {alert.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card">
                <h2>Overview</h2>
                <div className="stats-row">
                  <div className="stat-box">
                    <div className="value">{result.rows}</div>
                    <div className="label">Rows</div>
                  </div>
                  <div className="stat-box">
                    <div className="value">{result.columns}</div>
                    <div className="label">Columns</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>📖 Dataset Story</h2>
                <button onClick={handleGenerateStory} disabled={storyLoading}>
                  {storyLoading ? "Writing story..." : "Explain my dataset"}
                </button>
                {story && (
                  <p style={{ marginTop: "1rem", lineHeight: "1.6" }}>{story}</p>
                )}
              </div>

              {result.analysisId && <Chat analysisId={result.analysisId} />}

              <div className="card">
                <h2>Insights</h2>
                <ul className="insights-list">
                  {result.eda.insights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>

              {result.ai_insights && (
                <div className="card">
                  <h2>🤖 AI Insights</h2>
                  <ul className="insights-list">
                    {result.ai_insights.map((insight, i) => (
                      <li key={i} style={{ background: "#eef1ff", borderLeft: "4px solid #4f46e5" }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.suggestions && (
                <div className="card">
                  <h2>🛠 Recommended Actions</h2>
                  <ul className="insights-list">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} style={{ background: "#e8f9ee", borderLeft: "4px solid #22c55e" }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card">
                <h2>Column Details</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Missing</th>
                      <th>Unique</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.column_details.map((col, i) => (
                      <tr key={i}>
                        <td>{col.name}</td>
                        <td>{col.datatype}</td>
                        <td>{col.missing_values}</td>
                        <td>{col.unique_values}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>Category Charts</h2>
                <div className="chart-grid">
                  {Object.entries(result.eda.charts)
                    .filter(([_, chart]) => chart.type === "bar")
                    .map(([colName, chart]) => (
                      <div key={colName}>
                        <h3>{colName}</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={chart.labels.map((label, i) => ({
                              name: label,
                              count: chart.counts[i]
                            }))}
                          >
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                </div>
              </div>

              <div className="card">
                <h2>Numeric Distributions</h2>
                <div className="chart-grid">
                  {Object.entries(result.eda.charts)
                    .filter(([_, chart]) => chart.type === "histogram")
                    .map(([colName, chart]) => (
                      <div key={colName}>
                        <h3>{colName}</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={chart.bins.slice(0, -1).map((bin, i) => ({
                              name: `${bin}`,
                              count: chart.counts[i]
                            }))}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                </div>
              </div>

              <div className="card">
                <h2>Correlation Heatmap</h2>
                {result.eda.correlations.strong_pairs.length === 0 ? (
                  <p>No strong correlations found.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Column A</th>
                        <th>Column B</th>
                        <th>Correlation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.eda.correlations.strong_pairs.map((pair, i) => (
                        <tr key={i}>
                          <td>{pair.column_a}</td>
                          <td>{pair.column_b}</td>
                          <td style={{
                            color: pair.correlation > 0 ? "#16a34a" : "#dc2626",
                            fontWeight: "bold"
                          }}>
                            {pair.correlation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;