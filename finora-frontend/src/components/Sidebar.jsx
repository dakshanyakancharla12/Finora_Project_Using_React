import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  LayoutDashboard,
  Lightbulb,
  MoreHorizontal,
  Target,
  Wallet
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initialsOf } from "../utils/format";
import { getPhoto } from "../utils/photo";

export default function Sidebar({ open = false, onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapper = useRef(null);

  const name = user?.fullName || "My Finances";
  const initials = initialsOf(user?.fullName) || "MF";
  const photo = getPhoto(user?.email);

  const onDashboard = location.pathname === "/";
  const onAnalytics = onDashboard && location.hash === "#analytics";
  const cls = (active) => `nav-link${active ? " active" : ""}`;

  useEffect(() => {
    const close = (event) => {
      if (wrapper.current && !wrapper.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <aside className={`sidebar${open ? " open" : ""}`} id="sidebar">
      <Link className="brand" to="/" onClick={onNavigate}>
        <span className="brand-icon">
          <Wallet />
        </span>
        <span>
          finora<span className="brand-dot">.</span>
        </span>
      </Link>

      <p className="nav-label">WORKSPACE</p>
      <nav className="navigation">
        <Link
          to="/"
          className={cls(onDashboard && !onAnalytics)}
          onClick={onNavigate}
        >
          <LayoutDashboard />
          <span>Overview</span>
        </Link>
        <Link
          to="/transactions"
          className={cls(location.pathname === "/transactions")}
          onClick={onNavigate}
        >
          <ArrowLeftRight />
          <span>Transactions</span>
        </Link>
        <Link
          to={{ pathname: "/", hash: "#analytics" }}
          className={cls(onAnalytics)}
          onClick={onNavigate}
        >
          <ChartNoAxesCombined />
          <span>Analytics</span>
        </Link>
        <Link to="/budgets" className={cls(false)} onClick={onNavigate}>
          <Target />
          <span>Budgets</span>
        </Link>
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <Lightbulb />
          </div>
          <h3>Build better habits</h3>
          <p>Small steps today lead to a healthier financial future.</p>
        </div>

        <div className="profile" id="sidebarProfile" ref={wrapper}>
          <div
            className={`avatar${photo ? " has-profile-photo" : ""}`}
            id="profileInitials"
          >
            {photo ? <img src={photo} alt="Profile Picture" /> : initials}
          </div>

          <div className="profile-info">
            <strong id="sidebarProfileName">{name}</strong>
            <span>Personal account</span>
          </div>

          <button
            type="button"
            className="profile-menu-button"
            id="profileMenuButton"
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((value) => !value);
            }}
          >
            <MoreHorizontal />
          </button>

          <div className="profile-dropdown" id="profileDropdown" hidden={!menuOpen}>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              Go to Profile
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
