import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📊 InsightGen</h1>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Analyzing..." : "Upload & Analyze"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Overview</h2>
          <p>Rows: {result.rows}</p>
          <p>Columns: {result.columns}</p>

          <h2>Insights</h2>
          <ul>
            {result.eda.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>

          <h2>Column Details</h2>
          <table border="1" cellPadding="6">
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

          <h2>Category Charts</h2>
          {Object.entries(result.eda.charts)
            .filter(([_, chart]) => chart.type === "bar")
            .map(([colName, chart]) => (
              <div key={colName} style={{ marginBottom: "2rem" }}>
                <h3>{colName}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={chart.labels.map((label, i) => ({
                      name: label,
                      count: chart.counts[i]
                    }))}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}

            <h2>Numeric Distributions</h2>
          {Object.entries(result.eda.charts)
            .filter(([_, chart]) => chart.type === "histogram")
            .map(([colName, chart]) => (
              <div key={colName} style={{ marginBottom: "2rem" }}>
                <h3>{colName}</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={chart.bins.slice(0, -1).map((bin, i) => ({
                      name: `${bin} - ${chart.bins[i + 1]}`,
                      count: chart.counts[i]
                    }))}
                  >
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}

          <h2>Correlation Heatmap</h2>
          {result.eda.correlations.strong_pairs.length === 0 ? (
            <p>No strong correlations found.</p>
          ) : (
            <table border="1" cellPadding="6">
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
                      color: pair.correlation > 0 ? "green" : "red",
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
      )}
    </div>
  );
}

export default App;