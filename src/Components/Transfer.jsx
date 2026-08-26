import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, updateUser, recordTransaction, generateId, formatCurrency } from "../utils/storage";

const FEE_RATE_EXTERNAL = 0.015;
const MIN_EXTERNAL_FEE = 1;

function computeFee(transferType, amount) {
  if (transferType === "own") return 0;
  return Math.max(MIN_EXTERNAL_FEE, Number((amount * FEE_RATE_EXTERNAL).toFixed(2)));
}

function Transfer() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");

  const [fromAccountId, setFromAccountId] = useState(user?.accounts?.[0]?.id || "");
  const [transferType, setTransferType] = useState("own");
  const [toAccountId, setToAccountId] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  const fromAccount = user.accounts.find((a) => a.id === fromAccountId);
  const otherOwnAccounts = user.accounts.filter((a) => a.id !== fromAccountId);
  const beneficiary = (user.beneficiaries || []).find((b) => b.id === beneficiaryId);

  const fee = computeFee(transferType, Number(amount) || 0);
  const total = (Number(amount) || 0) + fee;

  const recipientLabel =
    transferType === "own"
      ? (() => {
          const acc = otherOwnAccounts.find((a) => a.id === toAccountId);
          return acc ? `${acc.type} Account (${acc.accountNumber}) — you` : "";
        })()
      : beneficiary
      ? `${beneficiary.name} (${beneficiary.accountNumber}) — ${beneficiary.bank}`
      : "";

  const handleReview = (e) => {
    e.preventDefault();
    setError("");

    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (!fromAccount) return setError("Select a source account.");
    if (transferType === "own" && !toAccountId) return setError("Select a destination account.");
    if (transferType === "beneficiary" && !beneficiaryId) return setError("Select a beneficiary.");
    if (amt + computeFee(transferType, amt) > fromAccount.balance) {
      return setError("Insufficient funds for this transfer (including fee).");
    }

    setStep("review");
  };

  const handleConfirm = () => {
    const amt = Number(amount);
    const transferId = generateId("TRF");
    let updatedUser = { ...user, accounts: user.accounts.map((a) => ({ ...a })) };

    const debitResult = recordTransaction(updatedUser, {
      accountId: fromAccountId,
      description: description || `Transfer to ${recipientLabel}`,
      type: "debit",
      amount: amt + fee,
      transferId,
      counterparty: recipientLabel,
    });
    updatedUser = debitResult.user;

    if (transferType === "own") {
      const creditResult = recordTransaction(updatedUser, {
        accountId: toAccountId,
        description: description || `Transfer from ${fromAccount.type} Account`,
        type: "credit",
        amount: amt,
        transferId,
        counterparty: `${fromAccount.type} Account (${fromAccount.accountNumber}) — you`,
      });
      updatedUser = creditResult.user;
    }

    updateUser(updatedUser);
    setUser(updatedUser);

    setResult({
      transferId,
      date: new Date().toISOString(),
      sender: `${fromAccount.type} Account (${fromAccount.accountNumber})`,
      recipient: recipientLabel,
      amount: amt,
      fee,
      total,
      status: "Successful",
    });
    setStep("success");
  };

  const handleDownloadReceipt = () => {
    const lines = [
      "TrustLine Bank — Transfer Receipt",
      `Transaction ID: ${result.transferId}`,
      `Date: ${new Date(result.date).toLocaleString()}`,
      `Sender: ${result.sender}`,
      `Recipient: ${result.recipient}`,
      `Amount: ${formatCurrency(result.amount)}`,
      `Fee: ${formatCurrency(result.fee)}`,
      `Total: ${formatCurrency(result.total)}`,
      `Status: ${result.status}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${result.transferId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === "success" && result) {
    return (
      <div className="content-page">
        <div className="content-inner">
          <div className="content-card success-banner">
            <div className="success-icon">✓</div>
            <h3>Transfer Successful</h3>
            <div className="summary-rows">
              <div className="summary-row"><span className="label">Transaction ID</span><span className="value">{result.transferId}</span></div>
              <div className="summary-row"><span className="label">Date/Time</span><span className="value">{new Date(result.date).toLocaleString()}</span></div>
              <div className="summary-row"><span className="label">Sender</span><span className="value">{result.sender}</span></div>
              <div className="summary-row"><span className="label">Recipient</span><span className="value">{result.recipient}</span></div>
              <div className="summary-row"><span className="label">Amount</span><span className="value">{formatCurrency(result.amount)}</span></div>
              <div className="summary-row"><span className="label">Status</span><span className="value">{result.status}</span></div>
            </div>
            <div className="button-row" style={{ marginTop: 20 }}>
              <button className="content-button secondary" onClick={handleDownloadReceipt}>Download receipt</button>
              <button className="content-button secondary" onClick={() => window.print()}>Print receipt</button>
            </div>
            <button className="content-button" style={{ marginTop: 12 }} onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="content-page">
        <div className="content-inner">
          <h2>Review Transfer</h2>
          <div className="content-card">
            <div className="summary-rows">
              <div className="summary-row"><span className="label">Sender account</span><span className="value">{fromAccount.type} Account ({fromAccount.accountNumber})</span></div>
              <div className="summary-row"><span className="label">Recipient</span><span className="value">{recipientLabel}</span></div>
              <div className="summary-row"><span className="label">Amount</span><span className="value">{formatCurrency(amount)}</span></div>
              <div className="summary-row"><span className="label">Transaction fee</span><span className="value">{formatCurrency(fee)}</span></div>
              <div className="summary-row"><span className="label">Total</span><span className="value">{formatCurrency(total)}</span></div>
              {description && <div className="summary-row"><span className="label">Description</span><span className="value">{description}</span></div>}
            </div>
            {error && <div className="content-error" style={{ marginTop: 16 }}>{error}</div>}
            <div className="button-row" style={{ marginTop: 20 }}>
              <button className="content-button secondary" onClick={() => setStep("form")}>Back</button>
              <button className="content-button" onClick={handleConfirm}>Confirm Transfer</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="content-inner">
        <h2>Transfer Funds</h2>
        <div className="content-card">
          {error && <div className="content-error">{error}</div>}
          <form onSubmit={handleReview} className="content-form">
            <div className="form-group">
              <label>From account</label>
              <select value={fromAccountId} onChange={(e) => { setFromAccountId(e.target.value); setToAccountId(""); }}>
                {user.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.type} Account — {a.accountNumber} ({formatCurrency(a.balance)})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Transfer type</label>
              <select value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                <option value="own">Between my accounts</option>
                <option value="beneficiary">To a beneficiary</option>
              </select>
            </div>

            {transferType === "own" ? (
              <div className="form-group">
                <label>To account</label>
                <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                  <option value="">Select account</option>
                  {otherOwnAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.type} Account — {a.accountNumber}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Beneficiary</label>
                <select value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)}>
                  <option value="">Select beneficiary</option>
                  {(user.beneficiaries || []).map((b) => (
                    <option key={b.id} value={b.id}>{b.nickname || b.name} — {b.accountNumber}</option>
                  ))}
                </select>
                {(!user.beneficiaries || user.beneficiaries.length === 0) && (
                  <p className="simulation-note" style={{ marginTop: 8 }}>
                    No beneficiaries yet. <Link to="/beneficiaries" style={{ color: "#0b4a7a" }}>Add one first</Link>.
                  </p>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Amount</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <button type="submit" className="content-button">Review Transfer →</button>
          </form>
        </div>
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
      </div>
    </div>
  );
}

export default Transfer;