import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? "login" : "register";

    try {
      const res = await axios.post(`http://localhost:3000/auth/${endpoint}`, {
        email,
        password
      });
      login(res.data.token, res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined text-on-primary-container text-3xl">analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">InsightGen</h1>
          <p className="text-xs text-on-surface-variant tracking-wider mt-1">AI ANALYTICS PLATFORM</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-outline-variant/30 p-8">
          <h2 className="text-xl font-bold text-on-surface mb-1">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            {isLogin ? "Log in to access your datasets and insights." : "Sign up to start analyzing your data with AI."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  mail
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
                  lock
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error-container/30 text-error text-sm px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Log In" : "Create Account"}</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sm text-primary font-semibold hover:underline"
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Log in"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Secure authentication powered by JWT
        </p>
      </div>
    </div>
  );
}

export default Auth;