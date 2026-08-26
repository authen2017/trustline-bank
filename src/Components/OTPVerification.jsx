import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingUser, setCurrentUser, clearPendingUser } from "../utils/storage";

function OTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const simulatedOTP = "6533249780";

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp === simulatedOTP) {
      const pendingUser = getPendingUser();
      if (pendingUser) {
        setCurrentUser(pendingUser);
        clearPendingUser();
      }
      navigate("/dashboard");
    } else {
      setError("Incorrect OTP. Please check the code and try again.");
    }
  };

  const handleResend = () => {
    setResent(true);
    setError("");
    setTimeout(() => setResent(false), 3000);
  };

  return (
    <div className="otp-page">
      <div className="otp-card">
        <div className="otp-icon">🔒</div>
        <h2>Enter OTP</h2>
        <p className="otp-subtitle">
          A one-time password has been sent to your registered email.
          Enter it below to continue securely.
        </p>

        {error && <div className="otp-error">{error}</div>}
        {resent && !error && (
          <div className="otp-error" style={{ background: "#eaf6ec", color: "#0f5c4d" }}>
            A new code has been sent.
          </div>
        )}

        <form onSubmit={handleVerify} className="otp-form">
          <label>OTP Code</label>
          <input
            type="text"
            inputMode="numeric"
            className="otp-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={10}
            placeholder="••••••"
            required
          />
          <button type="submit" className="otp-button">Verify →</button>
        </form>

        <div className="otp-resend">
          Didn't get a code?{" "}
          <button type="button" onClick={handleResend}>Resend code</button>
        </div>

        <p className="otp-hint">Simulation only — try 1235666666.</p>
      </div>
    </div>
  );
}

export default OTPVerification;