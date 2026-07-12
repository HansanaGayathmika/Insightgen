import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function History({ onSelect }) {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:3000/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (id) => {
    try {
      const res = await axios.get(`http://localhost:3000/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSelect(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this analysis?")) return;

    try {
      await axios.delete(`http://localhost:3000/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <p>Loading history...</p>;

  return (
    <div className="card">
      <h2>Past Analyses</h2>
      {error && <p className="error-text">{error}</p>}
      {history.length === 0 ? (
        <p>No uploads yet. Analyze a CSV to see it here.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Filename</th>
              <th>Date</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item._id}>
                <td>{item.filename}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleClick(item._id)}>View</button>
                </td>
                <td>
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    style={{ background: "#dc2626" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default History;