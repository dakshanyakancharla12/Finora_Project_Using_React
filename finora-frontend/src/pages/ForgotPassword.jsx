import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import usePageStyles from "../hooks/usePageStyles";
import { isValidEmail } from "../utils/format";

export default function ForgotPassword() {
  const ready = usePageStyles(["/css/forgot-password.css"], "forgot-page");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", kind: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    if (!isValidEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", kind: "error" });
      return;
    }

    setSubmitting(true);
    setMessage({ text: "", kind: "" });

    try {
      const data = await api.auth.forgotPassword({ email: email.trim() });
      // Show only what the server says.
      setMessage({
        text:
          data?.message ||
          "If the account exists, password reset instructions will be sent to your email.",
        kind: "success"
      });
    } catch (error) {
      setMessage({
        text: error.message || "Unable to connect to server.",
        kind: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="forgot-container">
      <div className="forgot-icon">🔐</div>

      <h2>Forgot Password?</h2>

      <p className="intro">Enter your registered email to reset your password.</p>

      <form id="forgotPasswordForm" onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email Address</label>

        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your registered email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit" id="resetButton" disabled={submitting}>
          {submitting ? "Sending..." : "Reset Password"}
        </button>
      </form>

      <p id="message" className={message.kind} role="status" aria-live="polite">
        {message.text}
      </p>

      <Link to="/login" className="back-link">
        ← Back to Login
      </Link>
    </main>
  );
}
