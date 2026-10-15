import { useEffect, useRef, useState } from "react";
import { Check, TrendingDown, TrendingUp, X } from "lucide-react";
import { today } from "../utils/format";

const CATEGORIES = [
  "Salary",
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Investment",
  "Other"
];

const emptyForm = () => ({
  type: "INCOME",
  title: "",
  amount: "",
  category: "Salary",
  transactionDate: today(),
  description: ""
});

const fromItem = (item) => ({
  type: String(item.type || "INCOME").toUpperCase(),
  title: item.title || "",
  amount: item.amount ?? "",
  category: item.category || "Salary",
  transactionDate: String(item.transactionDate || today()).slice(0, 10),
  description: item.description || ""
});

export default function TransactionModal({
  open,
  item,
  subtitle = "Enter your transaction details.",
  onClose,
  onSave
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return undefined;
    }

    setForm(item ? fromItem(item) : emptyForm());
    setError("");
    setSaving(false);
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => titleRef.current?.focus(), 50);

    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return; // stops double submit

    setError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }
    if (amount > 9999999999.99) {
      setError("That amount is too large.");
      return;
    }
    if (!form.title.trim() || !form.transactionDate) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      await onSave(
        {
          title: form.title.trim(),
          amount,
          type: form.type,
          category: form.category,
          transactionDate: form.transactionDate,
          description: form.description.trim()
        },
        item?.id ?? null
      );
    } catch (err) {
      setError(err.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const editing = Boolean(item);

  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      id="transactionModal"
      aria-hidden={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">YOUR MONEY, YOUR CHOICE</p>
            <h2 id="modalTitle">{editing ? "Edit transaction" : "Add transaction"}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            id="closeModalButton"
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form id="transactionForm" onSubmit={handleSubmit}>
          <div className="type-switch">
            <label className="type-option income-option">
              <input
                type="radio"
                name="type"
                value="INCOME"
                checked={form.type === "INCOME"}
                onChange={update("type")}
              />
              <span>
                <TrendingUp /> Income
              </span>
            </label>
            <label className="type-option expense-option">
              <input
                type="radio"
                name="type"
                value="EXPENSE"
                checked={form.type === "EXPENSE"}
                onChange={update("type")}
              />
              <span>
                <TrendingDown /> Expense
              </span>
            </label>
          </div>

          <label className="form-label" htmlFor="title">
            Transaction name
          </label>
          <input
            className="form-control"
            id="title"
            name="title"
            ref={titleRef}
            placeholder="e.g. Monthly salary"
            maxLength={100}
            required
            value={form.title}
            onChange={update("title")}
          />

          <div className="form-row">
            <div>
              <label className="form-label" htmlFor="amount">
                Amount (₹)
              </label>
              <input
                className="form-control"
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                max="9999999999.99"
                step="0.01"
                placeholder="0.00"
                required
                value={form.amount}
                onChange={update("amount")}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="category">
                Category
              </label>
              <select
                className="form-control"
                id="category"
                name="category"
                required
                value={form.category}
                onChange={update("category")}
              >
                {CATEGORIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="form-label" htmlFor="transactionDate">
            Date
          </label>
          <input
            className="form-control"
            id="transactionDate"
            name="transactionDate"
            type="date"
            required
            value={form.transactionDate}
            onChange={update("transactionDate")}
          />

          <label className="form-label" htmlFor="description">
            Note <span className="optional">(optional)</span>
          </label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows={3}
            maxLength={500}
            placeholder="Add a little detail..."
            value={form.description}
            onChange={update("description")}
          />

          <p className="form-error" id="formError" role="alert">
            {error}
          </p>

          <div className="modal-actions">
            <button
              type="button"
              className="outline-button"
              id="cancelButton"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              id="saveButton"
              disabled={saving}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check /> {editing ? "Update transaction" : "Save transaction"}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
