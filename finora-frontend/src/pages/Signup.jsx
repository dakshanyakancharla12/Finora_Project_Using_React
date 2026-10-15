import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import usePageStyles from "../hooks/usePageStyles";
import { isValidEmail } from "../utils/format";

const empty = { fullName: "", email: "", password: "", confirm: "" };

export default function Signup() {
  const ready = usePageStyles(["/css/auth.css"], "auth-page signup-page");
  const { status } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [agree, setAgree] = useState(false);
  const [show, setShow] = useState({ password: false, confirm: false });
  const [message, setMessage] = useState({ text: "", kind: "error" });
  const [submitting, setSubmitting] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  if (status === "authenticated") return <Navigate to="/" replace />;
  if (!ready) return null;

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const fail = (text) => setMessage({ text, kind: "error" });

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    if (form.fullName.trim().length < 2) return fail("Please enter your full name.");
    if (!isValidEmail(form.email)) return fail("Please enter a valid email address.");
    if (form.password.length < 8)
      return fail("Use a password with at least 8 characters.");
    if (form.password !== form.confirm)
      return fail("Passwords do not match. Please try again.");
    if (!agree) return fail("Please tick the checkbox to continue.");

    setSubmitting(true);
    setMessage({ text: "", kind: "error" });

    try {
      await api.auth.signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });

      // Only shown after the server confirmed the account was created.
      setMessage({
        text: "Account created successfully! Taking you to login...",
        kind: "success"
      });
      setForm(empty);
      setAgree(false);
      redirectTimer.current = setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      fail(error.message || "Unable to connect to server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="signup-card">
      <section className="signup-form-panel">
        <Link className="brand" to="/" aria-label="Finora home">
          <span className="brand-mark" aria-hidden="true">▰</span>
          <span>Finora</span>
        </Link>

        <div className="form-heading">
          <h1>Start managing your money today</h1>
          <p>
            Create your Finora account and take control
            <br className="desktop-break" /> of your finances.
          </p>
        </div>

        <form id="signupForm" className="auth-form" noValidate onSubmit={handleSubmit}>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            value={form.fullName}
            onChange={set("fullName")}
          />

          <label htmlFor="signupEmail">Email Address</label>
          <input
            id="signupEmail"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={set("email")}
          />

          <label htmlFor="signupPassword">Password</label>
          <div className="password-field">
            <input
              id="signupPassword"
              name="password"
              type={show.password ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={set("password")}
            />
            <button
              type="button"
              className="eye-button"
              aria-label={show.password ? "Hide password" : "Show password"}
              onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
            >
              {show.password ? "◎" : "◉"}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-field">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={show.confirm ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={set("confirm")}
            />
            <button
              type="button"
              className="eye-button"
              aria-label={show.confirm ? "Hide password" : "Show password"}
              onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            >
              {show.confirm ? "◎" : "◉"}
            </button>
          </div>

          <label className="terms-row">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <span style={{ color: "#138d72", fontWeight: 700 }}>Terms &amp; Conditions</span>
            </span>
          </label>

          <p
            className={`form-message ${message.kind}`}
            id="signupMessage"
            role="status"
            aria-live="polite"
          >
            {message.text}
          </p>

          <button className="submit-button signup-submit" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="switch-line">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>

      <section className="signup-art-panel">
        <div className="signup-art-wrap">
          <img
            src="/signup-illustration.png"
            alt="Illustration of a person planning finances with coins, a wallet, charts and a piggy bank"
          />
        </div>
        <div className="signup-art-copy">
          <h2>
            Managing your budget is the key
            <br />
            to <span>financial freedom.</span>
          </h2>
        </div>
      </section>
    </main>
  );
}
