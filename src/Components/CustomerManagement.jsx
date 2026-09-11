import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { isAdminLoggedIn, getUsers, toggleAccountStatus, formatCurrency } from "../utils/storage";

function CustomerManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedEmail, setExpandedEmail] = useState(null);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
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
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.accounts || []).some((a) => a.accountNumber.includes(q))
    );
  }, [users, search]);

  const handleToggle = async (email, accountId) => {
    try {
      await toggleAccountStatus(email, accountId);
      await loadUsers();
    } catch (err) {
      console.error(err);
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
        <h2 className="admin-page-title">Customer Management</h2>

        <div className="admin-card">
          <input
            type="text"
            className="admin-search"
            placeholder="Search by name, email, or account number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>Accounts</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <React.Fragment key={u.email}>
                  <tr>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>{(u.accounts || []).length}</td>
                    <td>
                      <button
                        className="btn-link"
                        onClick={() => setExpandedEmail(expandedEmail === u.email ? null : u.email)}
                      >
                        {expandedEmail === u.email ? "Hide" : "View details"}
                      </button>
                    </td>
                  </tr>
                  {expandedEmail === u.email && (
                    <tr>
                      <td colSpan={5}>
                        <table className="admin-subtable">
                          <thead>
                            <tr><th>Account Type</th><th>Account Number</th><th>Balance</th><th>Status</th><th></th></tr>
                          </thead>
                          <tbody>
                            {(u.accounts || []).map((a) => (
                              <tr key={a.id}>
                                <td>{a.type}</td>
                                <td>{a.accountNumber}</td>
                                <td>{formatCurrency(a.balance)}</td>
                                <td>
                                  <span className={`status-badge ${a.status === "Active" ? "active" : "inactive"}`}>
                                    {a.status}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn-link" onClick={() => handleToggle(u.email, a.id)}>
                                    {a.status === "Active" ? "Deactivate" : "Activate"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="admin-empty">No customers match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerManagement;
