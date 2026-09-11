import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getCurrentUser, formatCurrency } from "../utils/storage";

function TransactionHistory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [accountFilter, setAccountFilter] = useState(
    searchParams.get("account") || "all"
  );

  const [sortOrder, setSortOrder] = useState("desc");

  // Load the current user (now async — Firestore, not localStorage)
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

  // Filter and sort transactions
  const filtered = useMemo(() => {
    let txns = user?.transactions || [];

    if (accountFilter !== "all") {
      txns = txns.filter((t) => t.accountId === accountFilter);
    }

    if (typeFilter !== "all") {
      txns = txns.filter((t) => t.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      txns = txns.filter(
        (t) =>
          (t.description || "").toLowerCase().includes(q) ||
          (t.counterparty || "").toLowerCase().includes(q)
      );
    }

    return txns.slice().sort((a, b) =>
      sortOrder === "desc"
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date)
    );
  }, [user?.transactions, accountFilter, typeFilter, search, sortOrder]);

  const accountLabel = (accountId) => {
    const acc = (user?.accounts || []).find((a) => a.id === accountId);
    return acc ? `${acc.type} (${acc.accountNumber})` : "—";
  };

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="transactions-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="transactions-page">
      <div className="transactions-container">
        <div className="transactions-header">
          <div>
            <h1>Transaction History</h1>
            <p>View and manage your recent account transactions</p>
          </div>
          <Link to="/dashboard" className="back-dashboard">← Back to Dashboard</Link>
        </div>

        <div className="transaction-filters">
          <div className="filter-group search-group">
            <label htmlFor="transaction-search">Search</label>
            <input
              id="transaction-search"
              type="text"
              placeholder="Search description or recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="transaction-search"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="account-filter">Account</label>
            <select
              id="account-filter"
              value={accountFilter}
              onChange={(e) => {
                const value = e.target.value;
                setAccountFilter(value);
                setSearchParams(value === "all" ? {} : { account: value });
              }}
              className="transaction-select"
            >
              <option value="all">All accounts</option>
              {(user.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} — {a.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">Transaction Type</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="transaction-select"
            >
              <option value="all">All types</option>
              <option value="credit">Deposits</option>
              <option value="debit">Withdrawals</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-filter">Sort By</label>
            <select
              id="sort-filter"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="transaction-select"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="transactions-card">
          <div className="transactions-card-header">
            <div>
              <h2>Recent Transactions</h2>
              <p>Your latest account activity</p>
            </div>
            <div className="transaction-count">
              {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-transactions">
              <div className="empty-icon">$</div>
              <h3>No transactions found</h3>
              <p>There are no transactions matching your current filters.</p>
              {(search || typeFilter !== "all" || accountFilter !== "all") && (
                <button
                  className="clear-filters-button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setAccountFilter("all");
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td className="transaction-date">
                        {new Date(t.date).toLocaleDateString()}
                        <span>
                          {new Date(t.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td>
                        <div className="transaction-description">
                          <div className="transaction-icon">{t.type === "credit" ? "+" : "−"}</div>
                          <div>
                            <strong>{t.description}</strong>
                            {t.counterparty && <small>{t.counterparty}</small>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="account-name">{accountLabel(t.accountId)}</span>
                      </td>
                      <td>
                        <span className={t.type === "credit" ? "transaction-type credit" : "transaction-type debit"}>
                          {t.type === "credit" ? "Deposit" : "Withdrawal"}
                        </span>
                      </td>
                      <td className={t.type === "credit" ? "amount-credit" : "amount-debit"}>
                        {t.type === "credit" ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="balance-after">{formatCurrency(t.balanceAfter)}</td>
                      <td>
                        <span className="status-badge">{t.status || "Completed"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionHistory;
