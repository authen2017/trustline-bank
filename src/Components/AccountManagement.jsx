import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import {
  isAdminLoggedIn,
  getAllAccountsFlat,
  toggleAccountStatus,
  setAccountBalance,
  formatCurrency,
} from "../utils/storage";

function AccountManagement() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAccounts = async () => {
    try {
      const data = await getAllAccountsFlat();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      return true;
    });
  }, [accounts, typeFilter, statusFilter]);

  const handleToggle = async (email, accountId) => {
    try {
      await toggleAccountStatus(email, accountId);
      await loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (account) => {
    setEditingId(account.id);
    setEditValue(String(account.balance));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (email, accountId) => {
    const parsed = Number(editValue);
    if (isNaN(parsed) || parsed < 0) {
      alert("Please enter a valid, non-negative number.");
      return;
    }

    setSaving(true);
    try {
      await setAccountBalance(email, accountId, parsed);
      await loadAccounts();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving this balance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <AdminNav />
        <div className="admin-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-content">
        <h2 className="admin-page-title">Account Management</h2>

        <div className="admin-card">
          <div className="admin-filters-row">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All account types</option>
              <option value="Current">Current</option>
              <option value="Savings">Savings</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr><th>Account Number</th><th>Type</th><th>Customer</th><th>Balance</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.accountNumber}</td>
                  <td>{a.type}</td>
                  <td>{a.customerName} <span className="account-name">({a.customerEmail})</span></td>
                  <td>
                    {editingId === a.id ? (
                      <div className="balance-edit-row">
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="balance-edit-input"
                          disabled={saving}
                        />
                        <button className="btn-save" onClick={() => saveEdit(a.customerEmail, a.id)} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {formatCurrency(a.balance)}{" "}
                        <button className="btn-edit" onClick={() => startEdit(a)}>
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${a.status === "Active" ? "active" : "inactive"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-deactivate" onClick={() => handleToggle(a.customerEmail, a.id)}>
                      {a.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">No accounts match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccountManagement;
