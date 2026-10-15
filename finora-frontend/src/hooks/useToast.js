import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast() {
  const [toast, setToast] = useState({ message: "", error: false, show: false });
  const timer = useRef(null);

  const showToast = useCallback((message, error = false) => {
    clearTimeout(timer.current);
    setToast({ message, error, show: true });
    timer.current = setTimeout(
      () => setToast((current) => ({ ...current, show: false })),
      3200
    );
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
}
