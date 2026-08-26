import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { generateAccountNumber, generateId, getUsers, saveUsers } from "../utils/storage";

function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", dob: "", address: "", password: "", confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [accounts, setAccounts] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const users = getUsers();
    if (users.some((u) => u.email === formData.email)) {
      setError("An account with this email already exists.");
      return;
    }

    const newAccounts = [
      { id: generateId("acc"), type: "Current", accountNumber: generateAccountNumber(), balance: 0, status: "Active" },
      { id: generateId("acc"), type: "Savings", accountNumber: generateAccountNumber(), balance: 0, status: "Active" },
    ];

    const newUser = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      address: formData.address,
      password: formData.password,
      accounts: newAccounts,
      transactions: [],
      beneficiaries: [],
    };

    saveUsers([...users, newUser]);
    setAccounts(newAccounts);
  };

  if (accounts) {
    return (
      <div className="register-page">
        <div className="register-card register-success">
          <div className="success-icon">✓</div>
          <h2>Registration Successful</h2>
          <p className="register-subtitle">Your accounts have been created</p>

          <div className="account-summary">
            {accounts.map((a) => (
              <div className="account-summary-row" key={a.id}>
                <span className="acc-type">{a.type} Account</span>
                <span className="acc-number">{a.accountNumber}</span>
              </div>
            ))}
          </div>

          <p className="register-subtitle">
            Save these numbers — you'll use either your email or an account number to log in.
          </p>

          <button className="register-button" onClick={() => navigate("/login")}>
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create an Account</h2>
        <p className="register-subtitle">Simulation only — no real personal data is processed.</p>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="register-button">Create Account →</button>
        </form>

        <div className="register-login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Registration;