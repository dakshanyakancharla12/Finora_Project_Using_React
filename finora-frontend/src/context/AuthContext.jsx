import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { api } from "../api";
import { onUnauthorized } from "../api/client";

const AuthContext = createContext(null);

const normalizeUser = (data) => ({
  ...data,
  fullName: String(data?.fullName || data?.name || "").trim(),
  email: data?.email || ""
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading | authenticated | anonymous | error
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.profile.get();
      setUser(normalizeUser(data));
      setError("");
      setStatus("authenticated");
    } catch (err) {
      setUser(null);
      if (err.status === 401) {
        setStatus("anonymous");
      } else {
        setError(err.message);
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Session expired somewhere in the app -> go back to the login screen.
  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null);
        setStatus("anonymous");
      }),
    []
  );

  const login = useCallback(async (email, password) => {
    await api.auth.login({ email, password });

    // Prove the session really works before saying "logged in".
    let data;
    try {
      data = await api.profile.get();
    } catch {
      throw new Error(
        "Login was accepted, but the server did not keep your session. " +
          "Please check the backend session and cookie settings."
      );
    }
    setUser(normalizeUser(data));
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const setProfile = useCallback((data) => setUser(normalizeUser(data)), []);

  const value = useMemo(
    () => ({ user, status, error, refresh, login, logout, setProfile }),
    [user, status, error, refresh, login, logout, setProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
