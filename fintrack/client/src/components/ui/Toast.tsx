/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  message: React.ReactNode;
  type?: ToastType;
  durationMs?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  success: (message: React.ReactNode, title?: string) => void;
  error: (message: React.ReactNode, title?: string) => void;
  warning: (message: React.ReactNode, title?: string) => void;
  info: (message: React.ReactNode, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, title, type = "info", durationMs = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, title, message, type, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismiss(id);
        }, durationMs);
      }
    },
    [dismiss]
  );

  const success = useCallback((message: React.ReactNode, title?: string) => {
    toast({ message, title, type: "success" });
  }, [toast]);

  const error = useCallback((message: React.ReactNode, title?: string) => {
    toast({ message, title, type: "error", durationMs: 5000 });
  }, [toast]);

  const warning = useCallback((message: React.ReactNode, title?: string) => {
    toast({ message, title, type: "warning" });
  }, [toast]);

  const info = useCallback((message: React.ReactNode, title?: string) => {
    toast({ message, title, type: "info" });
  }, [toast]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />,
  };

  const borders = {
    success: "border-success/30 bg-card",
    error: "border-destructive/30 bg-card",
    warning: "border-warning/30 bg-card",
    info: "border-info/30 bg-card",
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-slideDown",
              borders[t.type || "info"]
            )}
          >
            {icons[t.type || "info"]}
            <div className="flex-1 space-y-0.5">
              {t.title && (
                <h4 className="text-xs font-bold text-foreground tracking-tight">{t.title}</h4>
              )}
              <div className="text-xs text-muted-foreground leading-relaxed">{t.message}</div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
