import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { isAdminLoggedIn, getSystemStats } from "../utils/storage";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate("/admin/login");
      return;
    }
    setStats(getSystemStats());
  }, [navigate]);

  if (!stats) return null;

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-content">
        <h2 className="admin-page-title">Admin Dashboard</h2>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p>Total Customers</p>
            <h3>{stats.totalCustomers}</h3>
          </div>
          <div className="admin-stat-card">
            <p>Total Accounts</p>
            <h3>{stats.totalAccounts}</h3>
          </div>
          <div className="admin-stat-card">
            <p>Total Transactions</p>
            <h3>{stats.totalTransactions}</h3>
          </div>
          <div className="admin-stat-card">
            <p>Total Transfers</p>
            <h3>{stats.totalTransfers}</h3>
          </div>
          <div className="admin-stat-card">
            <p>Bill Payments</p>
            <h3>{stats.totalBillPayments}</h3>
          </div>
          <div className="admin-stat-card">
            <p>System Activity</p>
            <h3>{stats.totalDeposits + stats.totalWithdrawals} events</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;