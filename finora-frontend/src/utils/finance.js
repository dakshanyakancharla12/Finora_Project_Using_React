import { normalizeType } from "./format";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const isIncome = (t) => normalizeType(t.type) === "INCOME";
const isExpense = (t) => {
  const type = normalizeType(t.type);
  return type === "EXPENSE" || type === "DEBIT";
};

export const monthKey = (value) => String(value || "").slice(0, 7);

export function summarize(transactions) {
  const income = round2(
    transactions
      .filter(isIncome)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );
  const expenses = round2(
    transactions
      .filter(isExpense)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );
  const balance = round2(income - expenses);
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  return { income, expenses, balance, savingsRate };
}

// Last 6 months, oldest first.
export function monthlySeries(transactions, now = new Date()) {
  const labels = [];
  const income = [];
  const expenses = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    labels.push(date.toLocaleDateString("en-IN", { month: "short" }));

    const items = transactions.filter((t) => monthKey(t.transactionDate) === key);

    income.push(
      round2(items.filter(isIncome).reduce((s, t) => s + Number(t.amount || 0), 0))
    );
    expenses.push(
      round2(items.filter(isExpense).reduce((s, t) => s + Number(t.amount || 0), 0))
    );
  }

  return { labels, income, expenses };
}

// [[category, total], ...] biggest first
export function categoryTotals(transactions) {
  const totals = {};
  transactions.filter(isExpense).forEach((t) => {
    const category = t.category || "Other";
    totals[category] = (totals[category] || 0) + Number(t.amount || 0);
  });
  return Object.entries(totals)
    .map(([name, value]) => [name, round2(value)])
    .sort((a, b) => b[1] - a[1]);
}

export function spentFor(transactions, category, month) {
  const wanted = String(category || "").toLowerCase();
  return round2(
    transactions
      .filter(
        (t) =>
          isExpense(t) &&
          String(t.category || "").toLowerCase() === wanted &&
          monthKey(t.transactionDate) === month
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
  );
}
