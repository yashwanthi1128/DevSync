import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import API from "../services/api";
import "./Login.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", formData);
      const { token, user } = res.data;
      if (!token || !user) throw new Error("Invalid response from server");
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate(user.role === "admin" ? "/admin" : "/home");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-header">
          <h1>DevSync</h1>
          <p>Welcome back, Sign in to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email"
              placeholder="you@example.com" value={formData.email}
              onChange={handleChange} required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input type={showPassword ? "text" : "password"}
                id="password" name="password" placeholder="••••••••"
                value={formData.password} onChange={handleChange}
                required autoComplete="current-password" />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}