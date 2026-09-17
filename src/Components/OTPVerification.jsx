import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPendingUser,
  setPendingUser,
  setCurrentUser,
  clearPendingUser,
  generateId,
} from "../utils/storage";
import { sendOtpEmail } from "../utils/emailService";

const CODE_LENGTH = 6;

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function OTPVerification() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputsRef = useRef([]);

  const focusInput = (index) => {
    const el = inputsRef.current[index];
    if (el) el.focus();
  };

  const verifyCode = (code) => {
    const pendingUser = getPendingUser();

    if (!pendingUser || !pendingUser._otpCode) {
      setError("Your session expired. Please log in again.");
      return;
    }

    if (Date.now() > pendingUser._otpExpiresAt) {
      setError("This code has expired. Please request a new one.");
      return;
    }

    if (code !== pendingUser._otpCode) {
      setError("Incorrect code. Please check and try again.");
      return;
    }

    // Success — strip the OTP fields before saving as the real logged-in user.
    // eslint-disable-next-line no-unused-vars
    const { _otpCode, _otpExpiresAt, _otpId, ...cleanUser } = pendingUser;
    setCurrentUser(cleanUser);
    clearPendingUser();
    navigate("/dashboard");
  };

  const handleChange = (index, value) => {
    // Only allow a single digit per box
    const clean = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError("");

    if (clean && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }

    // Auto-submit the instant all boxes are filled — this is what makes it
    // feel fast: no separate "Verify" click needed once the last digit lands.
    if (clean && index === CODE_LENGTH - 1) {
      const fullCode = next.join("");
      if (fullCode.length === CODE_LENGTH) {
        setVerifying(true);
        // Tiny delay so the last digit visibly appears before we react
        setTimeout(() => {
          verifyCode(fullCode);
          setVerifying(false);
        }, 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    e.preventDefault();

    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < CODE_LENGTH && i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    const lastFilled = Math.min(pasted.length, CODE_LENGTH) - 1;
    if (lastFilled >= 0) focusInput(lastFilled);

    if (pasted.length >= CODE_LENGTH) {
      setVerifying(true);
      setTimeout(() => {
        verifyCode(next.join(""));
        setVerifying(false);
      }, 100);
    }
  };

  const handleResend = async () => {
    setError("");
    const pendingUser = getPendingUser();
    if (!pendingUser) {
      setError("Your session expired. Please log in again.");
      return;
    }

    try {
      const newCode = generateOtpCode();
      const newExpiry = Date.now() + 5 * 60 * 1000;

      setPendingUser({
        ...pendingUser,
        _otpCode: newCode,
        _otpExpiresAt: newExpiry,
        _otpId: generateId("otp"),
      });

      await sendOtpEmail({
        toEmail: pendingUser.email,
        toName: pendingUser.fullName,
        otpCode: newCode,
      });

      setDigits(Array(CODE_LENGTH).fill(""));
      focusInput(0);
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Couldn't resend the code. Please try again.");
    }
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

        <div className="otp-digit-row" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="otp-digit-input"
              value={digit}
              disabled={verifying}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {verifying && <p className="otp-hint">Verifying...</p>}

        <div className="otp-resend">
          Didn't get a code?{" "}
          <button type="button" onClick={handleResend}>Resend code</button>
        </div>
      </div>
    </div>
  );
}

export default OTPVerification;
