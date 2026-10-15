export default function Toast({ toast }) {
  return (
    <div
      className={`toast${toast.show ? " show" : ""}${toast.error ? " error" : ""}`}
      id="toast"
      role="status"
      aria-live="polite"
    >
      {toast.message}
    </div>
  );
}
