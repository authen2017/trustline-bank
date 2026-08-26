import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { isAdminLoggedIn, getAllTransactionsFlat, isSuspicious, formatCurrency } from "../utils/storage";

function TransactionMonitoring() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [flagOnly, setFlagOnly] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    setTransactions(getAllTransactionsFlat());
  }, [navigate]);

  const filtered = useMemo(() => {
    let list = transactions;
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);
    if (flagOnly) list = list.filter((t) => isSuspicious(t));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.customerName.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, search, typeFilter, flagOnly]);

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-content">
        <h2 className="admin-page-title">Transaction Monitoring</h2>

        <div className="admin-card">
          <div className="admin-filters-row">
            <input
              type="text"
              className="admin-search"
              placeholder="Search by ID, customer, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              <option value="credit">Deposits</option>
              <option value="debit">Withdrawals</option>
            </select>
            <label className="admin-checkbox-label">
              <input type="checkbox" checked={flagOnly} onChange={(e) => setFlagOnly(e.target.checked)} />
              Flagged only (≥ $5,000)
            </label>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th><th>Customer</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className={isSuspicious(t) ? "admin-row-flagged" : ""}>
                  <td>{t.id} {isSuspicious(t) && <span className="flag-badge">⚠ Review</span>}</td>
                  <td>{t.customerName}</td>
                  <td className={t.type === "credit" ? "amount-credit" : "amount-debit"}>
                    {t.type === "credit" ? "Deposit" : "Withdrawal"}
                  </td>
                  <td>{formatCurrency(t.amount)}</td>
                  <td>{new Date(t.date).toLocaleString()}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TransactionMonitoring;