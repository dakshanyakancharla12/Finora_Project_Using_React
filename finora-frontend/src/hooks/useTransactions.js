import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.transactions.list();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected transaction data from the server.");
      }
      setTransactions(data);
      setError("");
    } catch (err) {
      setError(err.message || "Could not load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Throws on failure so the form can show the real server message.
  const save = useCallback(
    async (payload, id) => {
      if (id !== null && id !== undefined) {
        await api.transactions.update(id, payload);
      } else {
        await api.transactions.create(payload);
      }
      await load();
    },
    [load]
  );

  const remove = useCallback(
    async (id) => {
      await api.transactions.remove(id);
      await load();
    },
    [load]
  );

  return { transactions, loading, error, reload: load, save, remove };
}
