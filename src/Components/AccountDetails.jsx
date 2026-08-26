import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCurrentUser, formatCurrency } from "../utils/storage";

function AccountDetails() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  if (!user) {
    navigate("/login");
    return null;
  }

  const account = user.accounts.find((a) => a.id === accountId);
  if (!account) {
    return (
      <div className="account-details-page">
        <div className="account-details-inner">
          <div className="account-info-card">
            <p>Account not found.</p>
            <Link to="/dashboard">Back to dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const transactions = (user.transactions || [])
    .filter((t) => t.accountId === accountId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  const availableBalance = account.balance;

  return (
    <div className="account-details-page">
      <div className="account-details-inner">
        <div className="account-details-header">
          <h2>{account.type} Account</h2>
          <span className={`status-badge ${account.status === "Active" ? "active" : "inactive"}`}>
            {account.status}
          </span>
        </div>

        <div className="account-info-card">
          <div className="account-info-grid">
            <div className="info-item">
              <span className="info-label">Account Number</span>
              <span className="info-value">{account.accountNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Account Type</span>
              <span className="info-value">{account.type}</span>
            </div>
            <div className="info-item balance-highlight">
              <span className="info-label">Current Balance</span>
              <span className="info-value">{formatCurrency(account.balance)}</span>
            </div>
            <div className="info-item balance-highlight">
              <span className="info-label">Available Balance</span>
              <span className="info-value">{formatCurrency(availableBalance)}</span>
            </div>
          </div>
        </div>

        <div className="account-transactions-card">
          <h3>Recent Transactions</h3>
          {transactions.length === 0 ? (
            <p className="simulation-note">No transactions yet on this account.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Balance after</th><th>Status</th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleString()}</td>
                    <td>{t.description}</td>
                    <td className={t.type === "credit" ? "amount-credit" : "amount-debit"}>
                      {t.type === "credit" ? "Deposit" : "Withdrawal"}
                    </td>
                    <td>{formatCurrency(t.amount)}</td>
                    <td>{formatCurrency(t.balanceAfter)}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to={`/transactions?account=${account.id}`} className="view-history-link"> View full history →</Link>
        </div>

        <div className="account-details-links">
          <Link to="/dashboard" className="back-dashboard-link">← Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default AccountDetails;