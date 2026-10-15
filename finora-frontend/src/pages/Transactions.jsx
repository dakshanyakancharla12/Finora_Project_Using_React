import { useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import TransactionTable from "../components/TransactionTable";
import TransactionModal from "../components/TransactionModal";
import Toast from "../components/Toast";
import useTransactions from "../hooks/useTransactions";
import useToast from "../hooks/useToast";
import usePageStyles from "../hooks/usePageStyles";
import { money, normalizeType } from "../utils/format";
import { summarize } from "../utils/finance";

export default function Transactions() {
  const ready = usePageStyles(["/css/style.css"], "transactions-page");
  const { transactions, loading, error, save, remove } = useTransactions();
  const { toast, showToast } = useToast();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal] = useState({ open: false, item: null });

  const summary = useMemo(() => summarize(transactions), [transactions]);

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    return transactions
      .filter((item) => {
        const matchesType =
          typeFilter === "ALL" || normalizeType(item.type) === typeFilter;
        const haystack = [item.title, item.category, item.description, item.transactionDate]
          .join(" ")
          .toLowerCase();
        return matchesType && haystack.includes(text);
      })
      .sort((a, b) =>
        String(b.transactionDate || "").localeCompare(String(a.transactionDate || ""))
      );
  }, [transactions, search, typeFilter]);

  const closeModal = () => setModal({ open: false, item: null });

  const handleSave = async (payload, id) => {
    await save(payload, id);
    closeModal();
    showToast(
      id !== null ? "Transaction updated successfully." : "Transaction added successfully."
    );
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await remove(item.id);
      showToast("Transaction deleted successfully.");
    } catch (err) {
      showToast(err.message || "Could not delete this transaction.", true);
    }
  };

  if (!ready) return null;

  const plural = (n) => `${n} transaction${n === 1 ? "" : "s"}`;

  return (
    <>
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <header className="topbar">
            <div className="topbar-left">
              <div>
                <p className="eyebrow">YOUR FINANCIAL SPACE</p>
                <h1>Transactions</h1>
              </div>
            </div>

            <div className="topbar-right">
              <div className="date-pill">
                <CalendarDays />
                <span id="currentDate">
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>

              <button
                className="primary-button"
                id="addTransactionButton"
                onClick={() => setModal({ open: true, item: null })}
              >
                <Plus />
                Add transaction
              </button>
            </div>
          </header>

          <section className="welcome-row">
            <div>
              <h2>Every transaction, in one place.</h2>
              <p>Add, search, update, and manage your income and expenses.</p>
            </div>
          </section>

          <section className="summary-grid">
            <article className="summary-card">
              <div className="card-top">
                <span className="card-label">Total income</span>
                <span className="card-icon income-icon">
                  <TrendingUp />
                </span>
              </div>
              <h2 id="pageTotalIncome">{money(summary.income)}</h2>
              <div className="card-foot positive">Money received</div>
            </article>

            <article className="summary-card">
              <div className="card-top">
                <span className="card-label">Total expenses</span>
                <span className="card-icon expense-icon">
                  <TrendingDown />
                </span>
              </div>
              <h2 id="pageTotalExpenses">{money(summary.expenses)}</h2>
              <div className="card-foot negative">Money spent</div>
            </article>

            <article className="summary-card balance-card">
              <div className="card-top">
                <span className="card-label">Balance</span>
                <span className="card-icon balance-icon">
                  <Wallet />
                </span>
              </div>
              <h2 id="pageBalance">{money(summary.balance)}</h2>
              <div className="card-foot">Income minus expenses</div>
            </article>
          </section>

          <section className="panel transactions-panel">
            <div className="panel-heading transactions-heading">
              <div>
                <h3>All transactions</h3>
                <p>Search and manage your financial activity.</p>
              </div>
              <span className="panel-chip" id="transactionCount">
                {plural(transactions.length)}
              </span>
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
                aria-label="Filter by transaction type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">All transactions</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expenses</option>
              </select>
            </div>

            <TransactionTable
              variant="full"
              rows={rows}
              hasAny={transactions.length > 0}
              loading={loading}
              error={error}
              onEdit={(item) => setModal({ open: true, item })}
              onDelete={handleDelete}
            />

            <div className="table-footer">
              <span id="filteredCount">{plural(rows.length)} shown</span>
              <span>Finora transactions</span>
            </div>
          </section>

          <footer className="footer">
            <span>© {new Date().getFullYear()} Finora</span>
            <span>Make every rupee count ♥</span>
          </footer>
        </main>
      </div>

      <TransactionModal
        open={modal.open}
        item={modal.item}
        onClose={closeModal}
        onSave={handleSave}
      />
      <Toast toast={toast} />
    </>
  );
}
