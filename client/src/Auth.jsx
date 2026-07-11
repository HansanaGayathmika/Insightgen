import { useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const endpoint = isLogin ? "login" : "register";

    try {
      const res = await axios.post(`http://localhost:3000/auth/${endpoint}`, {
        email,
        password
      });
      login(res.data.token, res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: "4rem auto" }}>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "0.6rem", marginBottom: "0.8rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "0.6rem", marginBottom: "0.8rem" }}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" style={{ width: "100%" }}>
          {isLogin ? "Login" : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", cursor: "pointer", color: "#4f46e5" }}
         onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Need an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
}

export default Auth;