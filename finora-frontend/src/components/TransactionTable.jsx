import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  SearchX,
  Trash2,
  Wallet
} from "lucide-react";
import { formatDate, money, normalizeType } from "../utils/format";

// variant "dashboard" = fancy empty state, "full" = simple text (like the old pages)
export default function TransactionTable({
  rows,
  hasAny,
  loading,
  error,
  variant = "full",
  onEdit,
  onDelete
}) {
  let body;

  if (loading) {
    body = (
      <tr>
        <td colSpan={5} className="loading-cell">
          {variant === "dashboard"
            ? "Loading your transactions..."
            : "Loading transactions..."}
        </td>
      </tr>
    );
  } else if (error) {
    body = (
      <tr>
        <td colSpan={5} className="loading-cell">
          Unable to load transactions. {error}
        </td>
      </tr>
    );
  } else if (rows.length === 0 && variant === "dashboard") {
    body = (
      <tr>
        <td colSpan={5} className="empty-state">
          <div className="empty-icon">{hasAny ? <SearchX /> : <Wallet />}</div>
          <strong>
            {hasAny ? "No matching transactions" : "Your financial story starts here"}
          </strong>
          <span>
            {hasAny
              ? "Try another search term or filter."
              : "Add your first income or expense to see your dashboard come alive."}
          </span>
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    body = (
      <tr>
        <td colSpan={5} className="loading-cell">
          {hasAny
            ? "No matching transactions. Try another search."
            : "No transactions yet. Click Add transaction to begin."}
        </td>
      </tr>
    );
  } else {
    body = rows.map((item) => {
      const income = normalizeType(item.type) === "INCOME";
      const Symbol = income ? ArrowDownLeft : ArrowUpRight;

      return (
        <tr key={item.id}>
          <td>
            <div className="transaction-name">
              <span className={`transaction-symbol${income ? "" : " expense"}`}>
                <Symbol />
              </span>
              <span>
                <span className="transaction-title">{item.title || "Untitled"}</span>
                {item.description ? (
                  <span className="transaction-description">{item.description}</span>
                ) : null}
              </span>
            </div>
          </td>

          <td>
            <span className="category-badge">{item.category || "Other"}</span>
          </td>

          <td className="transaction-date">{formatDate(item.transactionDate)}</td>

          <td className={`amount ${income ? "income" : "expense"}`}>
            {income ? "+" : "−"}
            {money(item.amount)}
          </td>

          <td>
            <div className="row-actions">
              <button
                type="button"
                className="action-button"
                aria-label={`Edit ${item.title || "transaction"}`}
                title="Edit"
                onClick={() => onEdit(item)}
              >
                <Pencil />
              </button>
              <button
                type="button"
                className="action-button delete"
                aria-label={`Delete ${item.title || "transaction"}`}
                title="Delete"
                onClick={() => onDelete(item)}
              >
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>AMOUNT</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody id="transactionTableBody">{body}</tbody>
      </table>
    </div>
  );
}
