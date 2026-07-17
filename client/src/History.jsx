import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function History({ onSelect }) {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:3000/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
        <p className="text-sm text-on-surface-variant">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-outline-variant/30">
      <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Past Analyses
        </h3>
        <span className="px-3 py-1 bg-surface-container rounded-full text-xs text-primary font-bold">
          {history.length} {history.length === 1 ? "DATASET" : "DATASETS"}
        </span>
      </div>

      {error && (
        <div className="px-6 py-3 bg-error-container/30 text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">folder_off</span>
          <p className="text-sm text-on-surface-variant">No uploads yet. Analyze a CSV to see it here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 text-xs text-on-surface-variant uppercase tracking-wider font-bold">Filename</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant uppercase tracking-wider font-bold">Date</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant uppercase tracking-wider font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {history.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => handleClick(item._id)}
                  className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline text-xl">description</span>
                      <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                        {item.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClick(item._id); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        View
                      </button>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        disabled={deletingId === item._id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-error text-xs font-bold hover:bg-error-container/40 transition-colors disabled:opacity-40"
                      >
                        {deletingId === item._id ? (
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">delete</span>
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;