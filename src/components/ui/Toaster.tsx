import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Toast, type ToastType } from "./Toast";

// ── Types ──

interface ToastConfig {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastEntry extends ToastConfig {
  id: string;
}

interface ToasterContextValue {
  showToast: (config: ToastConfig) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

// ── Constants ──

const MAX_TOASTS = 5;

// ── Context ──

const ToasterContext = createContext<ToasterContextValue | undefined>(undefined);

export function useToast(): ToasterContextValue {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error("useToast must be used within a ToasterProvider");
  return ctx;
}

// ── Provider ──

interface ToasterProviderProps {
  children: ReactNode;
}

export function ToasterProvider({ children }: ToasterProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (config: ToastConfig) => {
      const id = crypto.randomUUID();

      setToasts((prev) => {
        // Deduplicate: if the same message+type is already showing, skip
        const duplicate = prev.find(
          (t) => t.type === config.type && t.message === config.message,
        );
        if (duplicate) return prev;

        // Enforce max toasts — remove oldest if at limit
        const next = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
        return [...next, { ...config, id }];
      });
    },
    [],
  );

  const value: ToasterContextValue = {
    showToast,
    success: useCallback(
      (message, description) => showToast({ type: "success", message, description }),
      [showToast],
    ),
    error: useCallback(
      (message, description) => showToast({ type: "error", message, description }),
      [showToast],
    ),
    warning: useCallback(
      (message, description) => showToast({ type: "warning", message, description }),
      [showToast],
    ),
    info: useCallback(
      (message, description) => showToast({ type: "info", message, description }),
      [showToast],
    ),
  };

  return (
    <ToasterContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          data-toast-portal
          className="fixed top-4 right-4 z-99999 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        >
          <div className="flex flex-col gap-3 pointer-events-auto">
            <AnimatePresence mode="popLayout">
              {toasts.map((toast) => (
                <Toast
                  key={toast.id}
                  id={toast.id}
                  type={toast.type}
                  message={toast.message}
                  description={toast.description}
                  duration={toast.duration}
                  onClose={removeToast}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>,
        document.body,
      )}
    </ToasterContext.Provider>
  );
}
