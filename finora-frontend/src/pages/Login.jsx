import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import usePageStyles from "../hooks/usePageStyles";
import { isValidEmail } from "../utils/format";

export default function Login() {
  const ready = usePageStyles(["/css/auth.css"], "auth-page login-page");
  const { login, status } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", kind: "error" });
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  if (!ready) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    if (!isValidEmail(email)) {
      setMessage({ text: "Please enter a valid email address.", kind: "error" });
      return;
    }
    if (!password) {
      setMessage({ text: "Please enter your password.", kind: "error" });
      return;
    }

    setSubmitting(true);
    setMessage({ text: "", kind: "error" });

    try {
      await login(email.trim(), password);
      // On success AuthContext flips to "authenticated" and the
      // redirect above takes the user to the dashboard.
    } catch (error) {
      setMessage({
        text: error.message || "Unable to connect to server.",
        kind: "error"
      });
      setSubmitting(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-art-panel">
        <div className="login-art-copy">
          <h1>
            Keep track of your money
            <br />
            and save for <span>your future.</span>
          </h1>
          <p>
            Finora helps you track expenses, plan budgets,
            <br className="desktop-break" /> and build your savings with confidence.
          </p>
        </div>
        <div className="login-art-wrap">
          <img
            src="/login-illustration.png"
            alt="Illustration of a person tracking finances with savings, coins and charts"
          />
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-inner">
          <Link className="brand" to="/" aria-label="Finora home">
            <span className="brand-mark" aria-hidden="true">▰</span>
            <span>Finora</span>
          </Link>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Login</h2>
          <p className="intro">Welcome back! Enter your details to continue.</p>

          <form id="loginForm" className="auth-form" noValidate onSubmit={handleSubmit}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="eye-button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "◎" : "◉"}
              </button>
            </div>

            <div className="forgot-row">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <p
              className={`form-message ${message.kind}`}
              id="loginMessage"
              role="status"
              aria-live="polite"
            >
              {message.text}
            </p>

            <button className="submit-button" type="submit" disabled={submitting}>
              {submitting ? "Logging in..." : "Login"} <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="or-divider">
            <span>OR</span>
          </div>
          <p className="switch-line">
            Don’t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
