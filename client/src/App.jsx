import { useState, useRef } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { useAuth } from "./AuthContext";
import Auth from "./Auth";
import History from "./History";
import ColumnDetails from "./ColumnDetails";
import Chat from "./Chat";

function calculateHealthScore(result) {
  if (!result?.eda) return 100;
  const totalCells = result.rows * result.columns;
  const totalMissing = result.column_details.reduce((sum, col) => sum + col.missing_values, 0);
  const missingPct = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
  const alertCount = result.eda.alerts?.length || 0;
  const duplicatePct = result.rows > 0 ? ((result.eda.duplicate_rows || 0) / result.rows) * 100 : 0;
  let score = 100;
  score -= missingPct * 1.5;
  score -= duplicatePct * 1;
  score -= alertCount * 2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthColor(score) {
  if (score >= 80) return "text-tertiary-fixed-dim";
  if (score >= 50) return "text-yellow-300";
  return "text-red-300";
}

function alertBadgeColor(type) {
  const colors = {
    "Constant": "bg-yellow-500",
    "Outliers": "bg-orange-500",
    "Missing": "bg-error",
    "Duplicates": "bg-error",
    "Unique": "bg-tertiary-fixed-dim text-tertiary",
    "Skewed": "bg-secondary-container",
    "High correlation": "bg-outline"
  };
  return colors[type] || "bg-outline";
}

function App() {
  const { token, email, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("upload");
  const [story, setStory] = useState(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!token) return <Auth />;

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

  const score = result ? calculateHealthScore(result) : 0;
  const missingAlert = result?.eda?.alerts?.find(a => a.type === "Missing");
  const outlierAlert = result?.eda?.alerts?.find(a => a.type === "Outliers");
  const uniqueAlert = result?.eda?.alerts?.find(a => a.type === "Unique");

  return (
    <div className="bg-background text-on-background min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 bg-surface shadow-md flex flex-col py-8 z-50">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container">analytics</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">InsightGen</h1>
              <p className="text-xs text-on-surface-variant opacity-70">AI Analytics</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setView("upload")}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              view === "upload" ? "border-l-4 border-primary bg-surface-container-high text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">upload_file</span>
            <span className="text-sm">Data Upload</span>
          </button>

          <button
            onClick={() => setView("history")}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              view === "history" ? "border-l-4 border-primary bg-surface-container-high text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="text-sm">History</span>
          </button>

          <button
            onClick={() => setView("columns")}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              view === "columns" ? "border-l-4 border-primary bg-surface-container-high text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined">view_column</span>
            <span className="text-sm">Column Details</span>
          </button>

          <button disabled className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant opacity-40 cursor-default">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        <div className="px-6 mt-auto pt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 px-4 rounded-lg font-bold hover:bg-primary-container transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Upload</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-[280px] flex-1 flex flex-col min-h-screen relative">
        {/* TOP BAR */}
        <header className="sticky top-0 z-40 h-16 bg-surface border-b border-outline-variant flex items-center justify-between px-8">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Search datasets or insights..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined">help</span>
            </button>
            <div className="h-8 w-[1px] bg-outline-variant mx-1"></div>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={logout} title="Click to logout">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                {email ? email[0].toUpperCase() : "U"}
              </div>
              <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{email}</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-[1400px] mx-auto w-full space-y-8">
          {view === "history" && (
            <History onSelect={(data) => { setResult(data); setView("upload"); }} />
          )}

          {view === "columns" && (
            <ColumnDetails result={result} token={token} />
          )}

          {view === "upload" && (
            <>
              {/* Upload bar */}
              <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 flex-wrap">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-all"
                >
                  {loading ? "Analyzing..." : "Upload & Analyze"}
                </button>
                {error && <span className="text-error font-medium">{error}</span>}
              </div>

              {loading && (
                <div className="space-y-6">
                  <div className="skeleton h-48 rounded-xl"></div>
                  <div className="skeleton h-32 rounded-xl"></div>
                </div>
              )}

              {!loading && result && (
                <>
                  {/* HERO */}
                  <section className="relative overflow-hidden bg-primary-container rounded-xl p-8 shadow-md">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      <div className="md:col-span-7 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-on-primary-container/20 text-on-primary-container rounded-full border border-on-primary-container/30">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span className="text-xs font-semibold">Current Dataset</span>
                        </div>
                        <h2 className="text-3xl font-bold text-on-primary">{result.filename || "Uploaded Dataset"}</h2>
                        <p className="text-on-primary/80 max-w-lg">
                          {result.rows.toLocaleString()} rows across {result.columns} columns. InsightGen scanned this dataset for data quality issues, anomalies, and patterns.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/20">
                            <p className="text-on-primary/60 text-xs">Rows</p>
                            <p className="text-on-primary font-bold text-xl">{result.rows.toLocaleString()}</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/20">
                            <p className="text-on-primary/60 text-xs">Columns</p>
                            <p className="text-on-primary font-bold text-xl">{result.columns}</p>
                          </div>
                          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-lg border border-white/20">
                            <p className="text-on-primary/60 text-xs">Health Score</p>
                            <p className={`font-bold text-xl ${healthColor(score)}`}>{score}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-5 hidden md:block">
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/30 p-6 flex flex-col gap-4 shadow-lg">
                          <h4 className="text-xs uppercase tracking-wider text-primary font-bold">Scan Progress</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-medium text-primary">Type Recognition</span>
                              <span className="text-sm text-primary">100%</span>
                            </div>
                            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-primary w-full"></div>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                              <span className="text-sm font-medium text-primary">Alerts Found</span>
                              <span className="text-sm text-primary">{result.eda.alerts?.length || 0}</span>
                            </div>
                            <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${Math.min(100, (result.eda.alerts?.length || 0) * 10)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* BENTO ALERTS */}
                  <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 flex items-start gap-4">
                      <div className="p-3 rounded-full bg-error-container text-error">
                        <span className="material-symbols-outlined">warning</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-on-surface mb-1">Missing Values Alert</h4>
                        {missingAlert ? (
                          <p className="text-sm text-on-surface-variant">{missingAlert.message}</p>
                        ) : (
                          <p className="text-sm text-on-surface-variant">No significant missing values detected.</p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-lg bg-secondary-container/10 text-secondary">
                          <span className="material-symbols-outlined">analytics</span>
                        </span>
                        <span className="text-xs text-on-surface-variant">Outlier Report</span>
                      </div>
                      {outlierAlert ? (
                        <>
                          <p className="text-xs uppercase text-on-surface-variant">{outlierAlert.column}</p>
                          <p className="text-sm text-on-surface-variant">{outlierAlert.message}</p>
                        </>
                      ) : (
                        <p className="text-sm text-on-surface-variant">No significant outliers detected.</p>
                      )}
                    </div>

                    <div className="col-span-1 bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-lg bg-tertiary-fixed-dim/20 text-tertiary">
                          <span className="material-symbols-outlined">check_circle</span>
                        </span>
                        <span className="text-xs text-on-surface-variant">Integrity Check</span>
                      </div>
                      {uniqueAlert ? (
                        <>
                          <p className="text-xs uppercase text-on-surface-variant">{uniqueAlert.column}</p>
                          <p className="text-sm text-on-surface-variant">{uniqueAlert.message}</p>
                        </>
                      ) : (
                        <p className="text-sm text-on-surface-variant">No unique-key issues found.</p>
                      )}
                    </div>
                  </section>

                  {/* Full alerts table */}
                  {result.eda.alerts && result.eda.alerts.length > 0 && (
                    <section className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className="p-6 border-b border-outline-variant">
                        <h3 className="text-lg font-bold text-on-surface">🚨 All Alerts ({result.eda.alerts.length})</h3>
                      </div>
                      <div className="divide-y divide-outline-variant">
                        {result.eda.alerts.map((alert, i) => (
                          <div key={i} className="flex justify-between items-center px-6 py-4">
                            <span className="text-sm text-on-surface">
                              {alert.column && <code className="bg-surface-container px-2 py-1 rounded mr-2">{alert.column}</code>}
                              {alert.column ? alert.message.replace(alert.column, "").trim() : alert.message}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${alertBadgeColor(alert.type)}`}>
                              {alert.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* AI Insights + Recommended Actions */}
                  <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                      <h3 className="text-xl font-bold text-on-surface">AI Insights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(result.ai_insights || []).map((insight, i) => (
                          <div key={i} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-secondary">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                              <span className="text-xs font-bold text-secondary uppercase">Insight {i + 1}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>

                      {result.suggestions && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                          <div className="p-6 border-b border-outline-variant">
                            <h3 className="text-lg font-bold text-on-surface">🛠 Recommended Actions</h3>
                          </div>
                          <div className="divide-y divide-outline-variant">
                            {result.suggestions.map((s, i) => (
                              <div key={i} className="px-6 py-4 text-sm text-on-surface-variant">{s}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-on-surface mb-3">📖 Dataset Story</h3>
                        <button
                          onClick={handleGenerateStory}
                          disabled={storyLoading}
                          className="bg-primary text-on-primary px-5 py-2 rounded-lg font-bold disabled:opacity-40"
                        >
                          {storyLoading ? "Writing story..." : "Explain my dataset"}
                        </button>
                        {story && <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">{story}</p>}
                      </div>

                      {result.analysisId && (
                        <div className="bg-white rounded-xl shadow-md p-6">
                          <Chat analysisId={result.analysisId} />
                        </div>
                      )}
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-4 space-y-8">
                      <div className="bg-white p-6 rounded-xl shadow-md border border-outline-variant/30">
                        <h4 className="text-lg font-bold text-on-surface mb-4">Column Distribution</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined">text_snippet</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1 text-sm">
                                <span className="font-bold text-on-surface">Categorical</span>
                                <span className="text-on-surface-variant">{result.eda.categorical_columns.length} Cols</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container rounded-full">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${(result.eda.categorical_columns.length / result.columns) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center text-secondary">
                              <span className="material-symbols-outlined">pin</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1 text-sm">
                                <span className="font-bold text-on-surface">Numeric</span>
                                <span className="text-on-surface-variant">{result.eda.numerical_columns.length} Cols</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container rounded-full">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${(result.eda.numerical_columns.length / result.columns) * 100}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-md border border-outline-variant/30">
                        <h4 className="text-lg font-bold text-on-surface mb-4">Column Details</h4>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-on-surface-variant uppercase">
                                <th className="pb-2">Name</th>
                                <th className="pb-2">Missing</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.column_details.map((col, i) => (
                                <tr key={i} className="border-t border-outline-variant/30">
                                  <td className="py-2 text-on-surface">{col.name}</td>
                                  <td className="py-2 text-on-surface-variant">{col.missing_values}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* CATEGORY CHARTS */}
                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-on-surface">Category Charts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(result.eda.charts)
                        .filter(([_, chart]) => chart.type === "bar")
                        .map(([colName, chart]) => (
                          <div key={colName} className="bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 h-[300px] flex flex-col">
                            <h5 className="font-bold text-on-surface mb-4">{colName}</h5>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chart.labels.map((label, i) => ({ name: label, count: chart.counts[i] }))}>
                                <XAxis dataKey="name" hide />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1f108e" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold text-on-surface">Numeric Distributions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(result.eda.charts)
                        .filter(([_, chart]) => chart.type === "histogram")
                        .map(([colName, chart]) => (
                          <div key={colName} className="bg-white p-6 rounded-xl shadow-md border border-outline-variant/30 h-[300px] flex flex-col">
                            <h5 className="font-bold text-on-surface mb-4">{colName}</h5>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chart.bins.slice(0, -1).map((bin, i) => ({ name: `${bin}`, count: chart.counts[i] }))}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#6b38d4" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ))}
                    </div>
                  </section>

                  {/* Correlation */}
                  <section className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-on-surface mb-4">Correlation Heatmap</h3>
                    {result.eda.correlations.strong_pairs.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">No strong correlations found.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-on-surface-variant">
                            <th className="pb-2">Column A</th>
                            <th className="pb-2">Column B</th>
                            <th className="pb-2">Correlation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.eda.correlations.strong_pairs.map((pair, i) => (
                            <tr key={i} className="border-t border-outline-variant/30">
                              <td className="py-2">{pair.column_a}</td>
                              <td className="py-2">{pair.column_b}</td>
                              <td className={`py-2 font-bold ${pair.correlation > 0 ? "text-green-600" : "text-error"}`}>
                                {pair.correlation}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;