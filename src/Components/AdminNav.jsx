import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { adminLogout } from "../utils/storage";

function AdminNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/customers", label: "Customers" },
    { to: "/admin/accounts", label: "Accounts" },
    { to: "/admin/transactions", label: "Transactions" },
    { to: "/admin/reports", label: "Reports" },
  ];

  return (
    <div className="admin-nav">
      <div className="admin-nav-brand">TrustLine Bank — Admin</div>
      <div className="admin-nav-links">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`admin-nav-link ${location.pathname === l.to ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button className="admin-logout-btn" onClick={handleLogout}>Log out</button>
    </div>
  );
}

export default AdminNav;