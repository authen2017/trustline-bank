import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { findUserByIdentifier, setPendingUser } from "../utils/storage";

function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await findUserByIdentifier(identifier);

      if (!user || user.password !== password) {
        setError("Invalid account/email or password.");
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem("trustlineRememberedUser", identifier);
      }

      setPendingUser(user);
      navigate("/otp");
    } catch (err) {
      console.error(err);
      setError("Something went wrong logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout">
        <div className="login-brand">
          <div className="brand-name">TrustLine Bank</div>
          <div className="brand-subtitle">SECURE DIGITAL BANKING</div>
          <h1>Your money. Your future.</h1>
          <p>
            Manage your accounts, transfer money and monitor your financial
            activity securely from anywhere.
          </p>
          <p>
            <Link to="/register" className="open-account-link">Open an account →</Link>
          </p>
        </div>

        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to access your account</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <label>Account Number or Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <div className="password-row">
              <label>Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="login-remember">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Remember me</label>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing in..." : "Login securely →"}
            </button>
          </form>

          <div className="login-register">
            Don't have an account?<Link to="/register">Create an account</Link>
          </div>

          <div className="login-security">
            ✓ Secure login — your information is protected.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;