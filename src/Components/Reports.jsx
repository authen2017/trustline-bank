import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { isAdminLoggedIn, getAllTransactionsFlat, getDailyActivityLast7Days } from "../utils/storage";

function Reports() {
  const navigate = useNavigate();
  const [dailyActivity, setDailyActivity] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate("/admin/login");
      return;
    }

    let isMounted = true;
    const loadReports = async () => {
      try {
        const transactions = await getAllTransactionsFlat();
        if (!isMounted) return;

        setDailyActivity(getDailyActivityLast7Days(transactions));

        const transfers = transactions.filter((t) => t.transferId).length;
        const deposits = transactions.filter((t) => t.type === "credit" && !t.description.startsWith("Bill payment")).length;
        const withdrawals = transactions.filter((t) => t.type === "debit" && !t.transferId && !t.description.startsWith("Bill payment")).length;
        const billPayments = transactions.filter((t) => t.description.startsWith("Bill payment")).length;

        setBreakdown({ transfers, deposits, withdrawals, billPayments });
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReports();
    return () => { isMounted = false; };
  }, [navigate]);

  if (loading || !breakdown) {
    return (
      <div className="admin-page">
        <AdminNav />
        <div className="admin-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...dailyActivity.map((d) => d.count));
  const maxBreakdown = Math.max(1, breakdown.transfers, breakdown.deposits, breakdown.withdrawals, breakdown.billPayments);

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-content">
        <h2 className="admin-page-title">Reports & Analytics</h2>

        <div className="admin-card">
          <h3>Daily Transactions (last 7 days)</h3>
          <div className="bar-chart">
            {dailyActivity.map((d) => (
              <div className="bar-chart-col" key={d.label}>
                <div className="bar-chart-bar" style={{ height: `${(d.count / maxDaily) * 140}px` }}>
                  <span className="bar-chart-value">{d.count}</span>
                </div>
                <span className="bar-chart-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h3>Activity Breakdown</h3>
          <div className="hbar-chart">
            <div className="hbar-row">
              <span className="hbar-label">Transfers</span>
              <div className="hbar-track"><div className="hbar-fill transfers" style={{ width: `${(breakdown.transfers / maxBreakdown) * 100}%` }} /></div>
              <span className="hbar-value">{breakdown.transfers}</span>
            </div>
            <div className="hbar-row">
              <span className="hbar-label">Deposits</span>
              <div className="hbar-track"><div className="hbar-fill deposits" style={{ width: `${(breakdown.deposits / maxBreakdown) * 100}%` }} /></div>
              <span className="hbar-value">{breakdown.deposits}</span>
            </div>
            <div className="hbar-row">
              <span className="hbar-label">Withdrawals</span>
              <div className="hbar-track"><div className="hbar-fill withdrawals" style={{ width: `${(breakdown.withdrawals / maxBreakdown) * 100}%` }} /></div>
              <span className="hbar-value">{breakdown.withdrawals}</span>
            </div>
            <div className="hbar-row">
              <span className="hbar-label">Bill Payments</span>
              <div className="hbar-track"><div className="hbar-fill bills" style={{ width: `${(breakdown.billPayments / maxBreakdown) * 100}%` }} /></div>
              <span className="hbar-value">{breakdown.billPayments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
