import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Menu,
  PiggyBank,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import TransactionTable from "../components/TransactionTable";
import TransactionModal from "../components/TransactionModal";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import CategoryChart, { PALETTE } from "../components/CategoryChart";
import Toast from "../components/Toast";
import useTransactions from "../hooks/useTransactions";
import useToast from "../hooks/useToast";
import usePageStyles from "../hooks/usePageStyles";
import { money, normalizeType } from "../utils/format";
import { categoryTotals, monthlySeries, summarize } from "../utils/finance";

export default function Dashboard() {
  const ready = usePageStyles(["/css/style.css"]);
  const navigate = useNavigate();
  const location = useLocation();
  const { transactions, loading, error, save, remove } = useTransactions();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, item: null });

  const summary = useMemo(() => summarize(transactions), [transactions]);
  const series = useMemo(() => monthlySeries(transactions), [transactions]);
  const categories = useMemo(() => categoryTotals(transactions), [transactions]);

  const hasMonthlyData =
    series.income.some((v) => v > 0) || series.expenses.some((v) => v > 0);

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return transactions
      .filter((item) => {
        const matchesType =
          typeFilter === "ALL" || normalizeType(item.type) === typeFilter;
        const haystack =
          `${item.title || ""} ${item.category || ""} ${item.description || ""}`.toLowerCase();
        return matchesType && haystack.includes(text);
      })
      .sort(
        (a, b) =>
          String(b.transactionDate || "").localeCompare(String(a.transactionDate || "")) ||
          Number(b.id || 0) - Number(a.id || 0)
      )
      .slice(0, 5);
  }, [transactions, search, typeFilter]);

  // Escape closes the mobile menu
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // "Analytics" link in the sidebar scrolls to the charts
  useEffect(() => {
    if (ready && location.hash === "#analytics") {
      document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [ready, location.hash]);

  const closeModal = () => setModal({ open: false, item: null });

  const handleSave = async (payload, id) => {
    await save(payload, id);
    closeModal();
    showToast(
      id !== null ? "Transaction updated successfully." : "Transaction saved successfully."
    );
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await remove(item.id);
      showToast("Transaction deleted.");
    } catch (err) {
      showToast(err.message || "Could not delete this transaction. Please try again.", true);
    }
  };

  if (!ready) return null;

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <>
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

        <main className="main-content" id="overview">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-button mobile-menu"
                id="menuButton"
                aria-label="Toggle menu"
                onClick={() => setSidebarOpen((value) => !value)}
              >
                <Menu />
              </button>
              <div>
                <p className="eyebrow">YOUR FINANCIAL SPACE</p>
                <h1>
                  Good day! <span className="wave">✦</span>
                </h1>
              </div>
            </div>
            <div className="topbar-right">
              <div className="date-pill">
                <CalendarDays />
                <span id="currentDate">{todayLabel}</span>
              </div>
              <button
                className="primary-button"
                id="addTopButton"
                onClick={() => setModal({ open: true, item: null })}
              >
                <Plus /> Add transaction
              </button>
            </div>
          </header>

          <section className="welcome-row">
            <div>
              <h2>Your money, in perspective.</h2>
              <p>Here's what's happening with your finances.</p>
            </div>
            <span className="live-indicator">
              <span></span>{" "}
              {error ? "Unable to reach your finance tracker" : "Connected to your finance tracker"}
            </span>
          </section>

          <section className="summary-grid" aria-label="Financial summary">
            <article className="summary-card balance-card">
              <div className="card-top">
                <span className="card-label">Total balance</span>
                <span className="card-icon balance-icon">
                  <Wallet />
                </span>
              </div>
              <h2 id="totalBalance">{money(summary.balance)}</h2>
              <div className="card-foot">
                <span className="mini-dot"></span> Income minus expenses
              </div>
            </article>

            <article className="summary-card">
              <div className="card-top">
                <span className="card-label">Total income</span>
                <span className="card-icon income-icon">
                  <TrendingUp />
                </span>
              </div>
              <h2 id="totalIncome">{money(summary.income)}</h2>
              <div className="card-foot positive">
                <ArrowDownLeft /> Money received
              </div>
            </article>

            <article className="summary-card">
              <div className="card-top">
                <span className="card-label">Total expenses</span>
                <span className="card-icon expense-icon">
                  <TrendingDown />
                </span>
              </div>
              <h2 id="totalExpenses">{money(summary.expenses)}</h2>
              <div className="card-foot negative">
                <ArrowUpRight /> Money spent
              </div>
            </article>

            <article className="summary-card">
              <div className="card-top">
                <span className="card-label">Savings rate</span>
                <span className="card-icon savings-icon">
                  <PiggyBank />
                </span>
              </div>
              <h2 id="savingsRate">{summary.savingsRate.toFixed(1)}%</h2>
              <div className="card-foot">Income saved after expenses</div>
            </article>
          </section>

          <section className="content-grid" id="analytics">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h3>Income vs. expenses</h3>
                  <p>Track how money flows through your finances.</p>
                </div>
                <span className="panel-chip">Monthly</span>
              </div>
              <div className="chart-wrap">
                <IncomeExpenseChart
                  labels={series.labels}
                  income={series.income}
                  expenses={series.expenses}
                />
                <div
                  className="chart-empty"
                  id="chartEmpty"
                  style={{ display: hasMonthlyData ? "none" : "flex" }}
                >
                  <ChartNoAxesCombined />
                  <span>Add transactions to see your chart</span>
                </div>
              </div>
            </article>

            <article className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h3>Spending breakdown</h3>
                  <p>Where your expenses go.</p>
                </div>
              </div>
              <div className="donut-wrap">
                <CategoryChart categories={categories} />
                <div className="donut-center">
                  <span>Total spent</span>
                  <strong id="donutTotal">{money(summary.expenses)}</strong>
                </div>
              </div>
              <div id="categoryLegend" className="category-legend">
                {categories.length ? (
                  categories.slice(0, 5).map(([name, value], index) => (
                    <div className="legend-item" key={name}>
                      <span
                        className="legend-dot"
                        style={{ background: PALETTE[index % PALETTE.length] }}
                      ></span>
                      <span className="legend-name">{name}</span>
                      <span className="legend-amount">{money(value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="muted-empty">Add an expense to see your category insights.</p>
                )}
              </div>
            </article>
          </section>

          <section className="panel transactions-panel" id="transactions">
            <div className="panel-heading transactions-heading">
              <div>
                <h3>Recent transactions</h3>
                <p>Your latest financial activity, all in one place.</p>
              </div>
              <button
                className="outline-button"
                id="viewAllButton"
                onClick={() => navigate("/transactions")}
              >
                View all <ArrowRight />
              </button>
            </div>

            <div className="table-toolbar">
              <label className="search-box">
                <Search />
                <input
                  type="search"
                  id="searchInput"
                  placeholder="Search transactions..."
                  aria-label="Search transactions"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <select
                id="typeFilter"
                className="filter-select"
                aria-label="Filter by type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">All transactions</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expenses</option>
              </select>
            </div>

            <TransactionTable
              variant="dashboard"
              rows={rows}
              hasAny={transactions.length > 0}
              loading={loading}
              error={error}
              onEdit={(item) => setModal({ open: true, item })}
              onDelete={handleDelete}
            />

            <div className="table-footer">
              <span id="transactionCount">
                {transactions.length} transaction{transactions.length === 1 ? "" : "s"}
              </span>
              <span>Synced with your database</span>
            </div>
          </section>

          <footer className="footer">
            <span>© {new Date().getFullYear()} Finora</span>
            <span>
              Make every rupee count <span className="footer-heart">♥</span>
            </span>
          </footer>
        </main>
      </div>

      <TransactionModal
        open={modal.open}
        item={modal.item}
        subtitle="Enter the details below to record your activity."
        onClose={closeModal}
        onSave={handleSave}
      />
      <Toast toast={toast} />
    </>
  );
}
