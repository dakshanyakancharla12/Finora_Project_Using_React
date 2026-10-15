import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const centered = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  fontFamily: "Arial, sans-serif",
  color: "#102442",
  textAlign: "center",
  padding: "20px"
};

export default function ProtectedRoute() {
  const { status, error, refresh } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div style={centered}>Loading Finora...</div>;
  }

  if (status === "error") {
    return (
      <div style={centered}>
        <p>{error}</p>
        <button type="button" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
