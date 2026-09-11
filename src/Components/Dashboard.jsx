import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout, getAllTransactions, formatCurrency } from "../utils/storage";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const current = await getCurrentUser();
        if (!isMounted) return;

        if (!current) {
          navigate("/login");
          return;
        }
        setUser(current);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();
    return () => { isMounted = false; };
  }, [navigate]);

  if (loading) return <div className="dashboard"><p>Loading...</p></div>;
  if (!user) return null;

  const totalBalance = (user.accounts || []).reduce((sum, a) => sum + a.balance, 0);
  const recentTransactions = getAllTransactions(user).slice(0, 5);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user.fullName}</h2>
        <button className="btn btn-primary" onClick={handleLogout}>Log out</button>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card total">
          <p>Total Balance</p>
          <h2>{formatCurrency(totalBalance)}</h2>
        </div>
        {(user.accounts || []).map((a) => (
          <div className="summary-card" key={a.id}>
            <p>{a.type} Account</p>
            <h3>{formatCurrency(a.balance)}</h3>
            <Link to={`/account/${a.id}`} className="account-details-link">View details</Link>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <Link to="/transfer" className="btn btn-primary">Transfer</Link>
        <Link to="/pay-bill" className="btn btn-primary">Pay Bill</Link>
        <Link to="/beneficiaries" className="btn btn-primary">Add Beneficiary</Link>
        <Link to="/transactions" className="btn btn-primary">View Statement</Link>
      </div>

      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        {recentTransactions.length === 0 ? (
          <p className="simulation-note">No transactions yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleString()}</td>
                  <td>{t.description}</td>
                  <td className={t.type === "credit" ? "amount-credit" : "amount-debit"}>
                    {t.type === "credit" ? "Deposit" : "Withdrawal"}
                  </td>
                  <td>{formatCurrency(t.amount)}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link to="/transactions" className="transactions-link">View all transactions</Link>
      </div>
    </div>
  );
}

export default Dashboard;
