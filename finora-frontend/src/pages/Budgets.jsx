import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import usePageStyles from "../hooks/usePageStyles";
import { currentMonth, money } from "../utils/format";
import { monthKey, spentFor } from "../utils/finance";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Other"
];

const ERROR_COLOR = "#c0392b";
const WARN_COLOR = "#b7791f";

export default function Budgets() {
  const ready = usePageStyles(["/css/style.css", "/css/budgets.css"]);

  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ category: "", amount: "", month: currentMonth() });
  const [message, setMessage] = useState({ text: "", error: false });
  const [saving, setSaving] = useState(false);

  const [edit, setEdit] = useState({ open: false, id: null, category: "", amount: "", month: "" });
  const [editMessage, setEditMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [budgetData, transactionData] = await Promise.all([
        api.budgets.list(),
        api.transactions.list()
      ]);
      if (!Array.isArray(budgetData) || !Array.isArray(transactionData)) {
        throw new Error("Unexpected data received from the server.");
      }
      setBudgets(budgetData);
      setTransactions(transactionData);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message || "Could not load data from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!edit.open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") closeEdit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [edit.open]);

  const cards = useMemo(
    () =>
      budgets.map((budget) => {
        const amount = Number(budget.amount || 0);
        const month = monthKey(budget.budgetMonth);
        const spent = spentFor(transactions, budget.category, month);
        const remaining = Math.round((amount - spent) * 100) / 100;
        const percent = amount > 0 ? (spent / amount) * 100 : 0;
        return { budget, amount, spent, remaining, percent };
      }),
    [budgets, transactions]
  );

  const isDuplicate = (category, month, ignoreId) =>
    budgets.some(
      (b) =>
        b.id !== ignoreId &&
        String(b.category).toLowerCase() === category.toLowerCase() &&
        monthKey(b.budgetMonth) === month
    );

  async function handleAdd(event) {
    event.preventDefault();
    if (saving) return;

    const amount = Number(form.amount);

    if (!form.category || !form.month || !Number.isFinite(amount) || amount <= 0) {
      setMessage({ text: "Enter a category, month and valid amount.", error: true });
      return;
    }
    if (isDuplicate(form.category, form.month, null)) {
      setMessage({
        text: "A budget for this category and month already exists. Edit it instead.",
        error: true
      });
      return;
    }

    setSaving(true);
    try {
      await api.budgets.create({
        category: form.category,
        amount,
        budgetMonth: form.month
      });
      setMessage({ text: "Budget added successfully!", error: false });
      setForm({ category: "", amount: "", month: currentMonth() });
      await load();
    } catch (err) {
      setMessage({ text: err.message || "Could not save the budget.", error: true });
    } finally {
      setSaving(false);
    }
  }

  function openEdit(budget) {
    setEditMessage("");
    setEdit({
      open: true,
      id: budget.id,
      category: budget.category,
      amount: budget.amount,
      month: monthKey(budget.budgetMonth)
    });
  }

  function closeEdit() {
    setEdit({ open: false, id: null, category: "", amount: "", month: "" });
    setEditMessage("");
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (updating) return;

    const amount = Number(edit.amount);

    if (!edit.id || !edit.category || !edit.month || !Number.isFinite(amount) || amount <= 0) {
      setEditMessage("Enter a category, month and valid amount.");
      return;
    }
    if (isDuplicate(edit.category, edit.month, edit.id)) {
      setEditMessage("A budget for this category and month already exists.");
      return;
    }

    setUpdating(true);
    try {
      await api.budgets.update(edit.id, {
        category: edit.category,
        amount,
        budgetMonth: edit.month
      });
      closeEdit();
      setMessage({ text: "Budget updated successfully!", error: false });
      await load();
    } catch (err) {
      setEditMessage(err.message || "Could not update the budget.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      await api.budgets.remove(id);
      setMessage({ text: "Budget deleted successfully!", error: false });
      await load();
    } catch (err) {
      setMessage({ text: err.message || "Could not delete the budget.", error: true });
    }
  }

  if (!ready) return null;

  const categoryOptions = (
    <>
      <option value="">Choose category</option>
      {CATEGORIES.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </>
  );

  return (
    <>
      {/* Edit Budget Modal */}
      <div
        id="editBudgetModal"
        className={`budget-modal${edit.open ? " show" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeEdit();
        }}
      >
        <div className="budget-modal-content">
          <button
            type="button"
            id="closeBudgetModal"
            className="budget-modal-close"
            aria-label="Close dialog"
            onClick={closeEdit}
          >
            &times;
          </button>

          <h2>Edit Budget</h2>
          <p>Update your budget details</p>

          <form id="editBudgetForm" className="budget-form" onSubmit={handleUpdate}>
            <select
              id="editCategory"
              required
              value={edit.category}
              onChange={(e) => setEdit({ ...edit, category: e.target.value })}
            >
              {categoryOptions}
            </select>

            <input
              type="number"
              id="editAmount"
              placeholder="Budget amount (₹)"
              min="0.01"
              step="0.01"
              required
              value={edit.amount}
              onChange={(e) => setEdit({ ...edit, amount: e.target.value })}
            />

            <input
              type="month"
              id="editBudgetMonth"
              required
              value={edit.month}
              onChange={(e) => setEdit({ ...edit, month: e.target.value })}
            />

            <div className="budget-modal-actions">
              <button type="submit" id="updateBudgetButton" disabled={updating}>
                {updating ? "Updating..." : "Update Budget"}
              </button>
              <button type="button" id="cancelBudgetEdit" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </form>

          <p id="editBudgetMessage" role="status" style={{ color: ERROR_COLOR }}>
            {editMessage}
          </p>
        </div>
      </div>

      <main className="budget-page">
        <header className="budget-header">
          <div>
            <h1>Budget Planner</h1>
            <p>Plan your monthly spending and stay in control.</p>
          </div>
          <Link to="/">← Back to Dashboard</Link>
        </header>

        <form id="budgetForm" className="budget-form" onSubmit={handleAdd}>
          <select
            id="category"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categoryOptions}
          </select>

          <input
            type="number"
            id="amount"
            placeholder="Budget amount (₹)"
            min="0.01"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <input
            type="month"
            id="budgetMonth"
            required
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />

          <button type="submit" id="saveBudgetButton" disabled={saving}>
            {saving ? "Saving..." : "Add Budget"}
          </button>
        </form>

        <p
          id="budgetMessage"
          className="budget-message"
          role="status"
          style={{ color: message.error ? ERROR_COLOR : "#ffffff" }}
        >
          {message.text}
        </p>

        <section id="budgetGrid" className="budget-grid">
          {loading ? (
            <p>Loading budgets...</p>
          ) : loadError ? (
            <p style={{ color: "#ffffff" }}>Unable to load budgets. {loadError}</p>
          ) : cards.length === 0 ? (
            <p style={{ color: "#ffffff" }}>
              No budgets yet. Add your first monthly budget above.
            </p>
          ) : (
            cards.map(({ budget, amount, spent, remaining, percent }) => {
              const over = spent > amount;
              const warn = !over && percent >= 80;
              const barColor = over ? "#dc3545" : warn ? "#f0a030" : undefined;

              return (
                <article className="budget-card" key={budget.id}>
                  <h3>{budget.category}</h3>
                  <p>Month: {monthKey(budget.budgetMonth)}</p>
                  <p>Budget: {money(amount)}</p>
                  <p>Spent: {money(spent)}</p>
                  <p style={remaining < 0 ? { color: ERROR_COLOR } : undefined}>
                    Remaining: {money(remaining)}
                  </p>
                  <p>Used: {percent.toFixed(0)}%</p>

                  <div className="budget-progress">
                    <div
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        background: barColor
                      }}
                    />
                  </div>

                  {over ? (
                    <p style={{ color: ERROR_COLOR }}>
                      Over budget by {money(spent - amount)}
                    </p>
                  ) : warn ? (
                    <p style={{ color: WARN_COLOR }}>Approaching your limit</p>
                  ) : null}

                  <div className="budget-actions">
                    <button type="button" onClick={() => openEdit(budget)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(budget.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
