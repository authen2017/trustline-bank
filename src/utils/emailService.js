import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_jw44ih8";
const EMAILJS_TEMPLATE_ID = "template_eq8ql8e";
const EMAILJS_PUBLIC_KEY = "Pa-ATkGj8zuzmd90-";

emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Sends a one-time password to the given email address.
 * Returns a promise that resolves when the email has been sent.
 */
export function sendOtpEmail({ toEmail, toName, otpCode }) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: toEmail,
    to_name: toName,
    otp_code: otpCode,
  });
}
