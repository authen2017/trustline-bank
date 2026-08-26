import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src="my logo.png" alt="TrustLine Bank logo" className="logo-img" />
          <span>TrustLine Bank</span>
        </div>
        <div className="navbar-actions">
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/register" className="btn btn-primary">Open an Account</Link>
        </div>
      </nav>

      <header className="landing-header">
        <h1>Banking made simple, secure, fast and reliable</h1>
        <p className="tagline">
          Manage your accounts, transfer funds, pay bills, and stay in control
          of your finances,play your njangi securely — all in one place.
        </p>
        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/login" className="btn btn-outline btn-lg">Login to your account</Link>
        </div>
      </header>

      <section className="features">
        <div className="feature-card">
          <h3>Account management</h3>
          <p>View balances and manage all your accounts from a single dashboard.</p>
        </div>
        <div className="feature-card">
          <h3>Instant transfers</h3>
          <p>Send funds to beneficiaries quickly and track every transaction.</p>
        </div>
        <div className="feature-card">
            <h3>play njangi</h3>
            <p>register your njangi groups  and make secured reliable and trusted transaction</p>
        </div>
        <div className="feature-card">
          <h3>Bill payments</h3>
          <p>Pay your bills on time with saved payees and scheduled payments.</p>
        </div>
        <div className="feature-card">
          <h3>Bank-grade security</h3>
          <p>Two-factor authentication and real-time alerts keep your account safe.</p>
        </div>
      </section>

      <section className="security-info">
        <h2>Security you can trust</h2>
        <p>
          Every login is protected with multi-factor authentication, and
          you'll receive instant notifications for account activity —
          so you're always the first to know.
        </p>
      </section>

      <footer>
        <p>&copy; 2026 TrustLine Bank. Demo platform with a financial advisory system for you.</p>
      </footer>
    </div>
  );
}

export default LandingPage;