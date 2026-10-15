import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import usePageStyles from "../hooks/usePageStyles";
import { getPhoto, movePhoto, savePhoto } from "../utils/photo";

export default function Profile() {
  const ready = usePageStyles(["/css/profile.css"]);
  const navigate = useNavigate();
  const { user, setProfile, logout } = useAuth();

  const formRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState({ text: "", type: "error" });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [photo, setPhoto] = useState(() => getPhoto(user?.email));

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwShow, setPwShow] = useState({ current: false, next: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({ current: "", next: "", confirm: "", success: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Keep the fields in sync when the saved profile changes (but not while editing)
  useEffect(() => {
    if (!editing) {
      setFullName(user?.fullName || "");
      setEmail(user?.email || "");
    }
    setPhoto(getPhoto(user?.email));
  }, [user, editing]);

  if (!ready) return null;

  const showMessage = (text, type = "error") => setMessage({ text, type });

  function startEditing() {
    showMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    showMessage("");
    setEditing(false);
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (saving) return;
    if (!formRef.current.reportValidity()) return;

    setSaving(true);
    try {
      const payload = { fullName: fullName.trim(), email: email.trim() };
      const data = await api.profile.update(payload);

      const updated = {
        ...user,
        fullName: data?.fullName ?? payload.fullName,
        email: data?.email ?? payload.email
      };

      movePhoto(user?.email, updated.email);
      setProfile(updated);
      setEditing(false);
      showMessage(data?.message || "Profile updated successfully!", "success");
    } catch (error) {
      showMessage(error.message || "Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      showMessage(error.message || "Unable to log out.");
      setLoggingOut(false);
    }
  }

  function handlePhoto(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select a valid image.");
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage("Please select an image smaller than 2 MB.");
      input.value = "";
      return;
    }
    if (!user?.email) {
      showMessage("Profile is still loading. Please try again.");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        savePhoto(user.email, e.target.result);
        setPhoto(e.target.result);
        showMessage("");
      } catch {
        showMessage("Could not save the photo. Please try a smaller image.");
      }
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  async function changePassword(event) {
    event.preventDefault();
    if (pwSaving) return;

    setPwErrors({ current: "", next: "", confirm: "", success: "" });

    if (pw.next.length < 8) {
      setPwErrors((e) => ({ ...e, next: "New password must contain at least 8 characters." }));
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwErrors((e) => ({
        ...e,
        confirm: "New password and confirm password do not match."
      }));
      return;
    }

    setPwSaving(true);
    try {
      await api.profile.changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm
      });

      // Only after the server confirmed
      setPw({ current: "", next: "", confirm: "" });
      setPwErrors({ current: "", next: "", confirm: "", success: "Password updated successfully!" });
    } catch (error) {
      const text = error.message || "Could not change password.";
      const lower = text.toLowerCase();

      if (lower.includes("current password")) {
        setPwErrors((e) => ({ ...e, current: text }));
      } else if (lower.includes("confirm") || lower.includes("match")) {
        setPwErrors((e) => ({ ...e, confirm: text }));
      } else if (lower.includes("new password")) {
        setPwErrors((e) => ({ ...e, next: text }));
      } else {
        setPwErrors((e) => ({ ...e, confirm: text }));
      }
    } finally {
      setPwSaving(false);
    }
  }

  const clearPw = (...fields) =>
    setPwErrors((e) => {
      const copy = { ...e };
      fields.forEach((f) => (copy[f] = ""));
      return copy;
    });

  const toggle = (field) => setPwShow((s) => ({ ...s, [field]: !s[field] }));

  const passwordField = (field, label, autoComplete, errorKeys) => (
    <label>
      {label}
      <div className="password-wrapper">
        <input
          type={pwShow[field] ? "text" : "password"}
          id={`${field}Password`}
          name={`${field}Password`}
          required
          minLength={field === "current" ? undefined : 8}
          autoComplete={autoComplete}
          value={pw[field]}
          onChange={(e) => {
            setPw((p) => ({ ...p, [field]: e.target.value }));
            clearPw(...errorKeys);
          }}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={pwShow[field] ? "Hide password" : "Show password"}
          onClick={() => toggle(field)}
        >
          {pwShow[field] ? "Hide" : "Show"}
        </button>
      </div>
      <small className="field-error">{pwErrors[field]}</small>
      {field === "confirm" ? (
        <small className="field-success">{pwErrors.success}</small>
      ) : null}
    </label>
  );

  return (
    <main className="profile-page">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark"></span> Finora
        </Link>
        <Link className="back-link" to="/">
          ← Dashboard
        </Link>
      </header>

      <section className="heading">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>My Profile</h1>
        <p>Manage your personal information and account details.</p>
      </section>

      <section className="profile-card">
        <div className="profile-banner"></div>

        <div className="identity">
          <div className="avatar-container">
            <img
              src={photo || "/profile.jpeg"}
              alt="Profile Picture"
              className="profile-photo"
              id="profilePhoto"
            />

            <label htmlFor="photoInput" className="change-photo-btn">
              Change Photo
            </label>

            <input
              type="file"
              id="photoInput"
              accept="image/*"
              hidden
              onChange={handlePhoto}
            />
          </div>

          <div>
            <h2 id="displayName">{user?.fullName || "Finora User"}</h2>
            <p id="displayEmail">{user?.email || ""}</p>
          </div>
          <span className="account-badge">Personal Account</span>
        </div>

        <div className="card-content">
          <div className="section-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Keep your account details up to date.</p>
            </div>
            <button
              type="button"
              id="editButton"
              className="outline-btn"
              hidden={editing}
              onClick={startEditing}
            >
              Edit Profile
            </button>
          </div>

          <form id="profileForm" ref={formRef} onSubmit={saveProfile}>
            <div className="form-grid">
              <label>
                Full Name
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  minLength={2}
                  disabled={!editing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label>
                Email Address
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={!editing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <p id="message" className={`message ${message.type}`} role="status">
              {message.text}
            </p>

            <div className="form-actions" id="formActions" hidden={!editing}>
              <button
                type="button"
                id="cancelButton"
                className="outline-btn"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="account-section">
            <h3>Change Password</h3>
            <p>Update your password to keep your account secure.</p>

            <form id="passwordForm" onSubmit={changePassword}>
              {passwordField("current", "Current Password", "current-password", ["current"])}
              {passwordField("next", "New Password", "new-password", ["next", "confirm", "success"])}
              {passwordField("confirm", "Confirm New Password", "new-password", ["confirm", "success"])}

              <button type="submit" className="primary-btn" disabled={pwSaving}>
                {pwSaving ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>

          <div className="account-section">
            <h3>Account Details</h3>
            <div className="detail-row">
              <span>Account type</span>
              <strong>Personal Finance</strong>
            </div>
            <div className="detail-row">
              <span>Account status</span>
              <strong className="active-status">Active</strong>
            </div>
            <div className="detail-row">
              <span>Password</span>
              <strong>••••••••</strong>
            </div>
          </div>

          <div className="logout-section">
            <div>
              <h3>Sign out</h3>
              <p>Log out of your Finora account on this browser.</p>
            </div>
            <button
              type="button"
              id="logoutButton"
              className="logout-btn"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </section>

      <footer>© Finora · Take control of your finances.</footer>
    </main>
  );
}
