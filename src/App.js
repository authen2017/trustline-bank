import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

// Customer components
import LandingPage from "./Components/LandingPage";
import Login from "./Components/Login";
import Registration from "./Components/Registration";
import OTPVerification from "./Components/OTPVerification";
import Dashboard from "./Components/Dashboard";
import AccountDetails from "./Components/AccountDetails";
import TransactionHistory from "./Components/TransactionHistory";
import Transfer from "./Components/Transfer";
import Beneficiaries from "./Components/Beneficiaries";
import PayBill from "./Components/PayBill";

// Admin components
import AdminLogin from "./Components/AdminLogin";
import AdminDashboard from "./Components/AdminDashboard";
import CustomerManagement from "./Components/CustomerManagement";
import AccountManagement from "./Components/AccountManagement";
import TransactionMonitoring from "./Components/TransactionMonitoring";
import Reports from "./Components/Reports";

function App() {
  return (
    <Routes>

      {/*CUSTOMER  */}

      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Registration />} />

      <Route path="/otp" element={<OTPVerification />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="/account/:accountId"
        element={<AccountDetails />}
      />

      <Route
        path="/transactions"
        element={<TransactionHistory />}
      />

      <Route
        path="/transfer"
        element={<Transfer />}
      />

      <Route
        path="/beneficiaries"
        element={<Beneficiaries />}
      />

      <Route
        path="/pay-bill"
        element={<PayBill />}
      />


      {/*  ADMIN*/}

      <Route
        path="/admin"
        element={<AdminLogin />}
      />

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route
        path="/admin/customers"
        element={<CustomerManagement />}
      />

      <Route
        path="/admin/accounts"
        element={<AccountManagement />}
      />

      <Route
        path="/admin/transactions"
        element={<TransactionMonitoring />}
      />

      <Route
        path="/admin/reports"
        element={<Reports />}
      />


      {/* UNKNOWN URL */}

      <Route
        path="*"
        element={<LandingPage />}
      />

    </Routes>
  );
}

export default App;