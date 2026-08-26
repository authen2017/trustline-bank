import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, updateUser, recordTransaction, formatCurrency } from "../utils/storage";

function PayBill() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [accountId, setAccountId] = useState(user?.accounts?.[0]?.id || "");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    const account = user.accounts.find((a) => a.id === accountId);

    if (!payee.trim()) return setError("Enter a payee name.");
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (amt > account.balance) return setError("Insufficient funds.");

    const updatedUser = { ...user, accounts: user.accounts.map((a) => ({ ...a })) };
    const { transaction } = recordTransaction(updatedUser, {
      accountId, description: `Bill payment — ${payee}`, type: "debit", amount: amt, counterparty: payee,
    });

    updateUser(updatedUser);
    setUser(updatedUser);
    setSuccess(transaction);
  };

  if (success) {
    return (
      <div className="content-page">
        <div className="content-inner">
          <div className="content-card success-banner">
            <div className="success-icon">✓</div>
            <h3>Bill Paid</h3>
            <p>You paid {formatCurrency(success.amount)} to {payee}.</p>
            <div className="summary-rows">
              <div className="summary-row"><span className="label">Reference</span><span className="value">{success.id}</span></div>
            </div>
            <Link to="/dashboard" className="content-button" style={{ display: "block", textAlign: "center", marginTop: 20, textDecoration: "none", lineHeight: "50px" }}>
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="content-inner">
        <h2>Pay a Bill</h2>
        <div className="content-card">
          <p className="simulation-note">Simulation only.</p>
          {error && <div className="content-error">{error}</div>}
          <form onSubmit={handleSubmit} className="content-form">
            <div className="form-group">
              <label>Pay from</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {user.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.type} — {a.accountNumber} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payee</label>
              <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <button type="submit" className="content-button">Pay bill</button>
          </form>
        </div>
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
      </div>
    </div>
  );
}

export default PayBill;