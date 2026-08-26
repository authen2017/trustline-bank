import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../utils/storage";

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (adminLogin(username, password)) {
      navigate("/admin/dashboard");
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-layout" style={{ gridTemplateColumns: "1fr", maxWidth: 420, margin: "0 auto" }}>
        <div className="login-card">
          <h2>Admin Login</h2>
          <p className="login-subtitle">TrustLine Bank staff access only.</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="login-button">Login →</button>
          </form>
          <p className="otp-hint" style={{ marginTop: 16 }}>Demo credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;