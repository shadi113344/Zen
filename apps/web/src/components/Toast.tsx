import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ToastState {
  message: string;
  undo?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, undo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ message, undo });
    window.setTimeout(() => setToast(null), undo ? 5000 : 3000);
  }, []);

  const dismiss = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast-bar" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button type="button" className="toast-bar__undo" onClick={() => { toast.undo?.(); dismiss(); }}>
              Undo
            </button>
          )}
          <button type="button" className="toast-bar__close" onClick={dismiss} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
