import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const styles = {
            success: "bg-[#212529] text-white border-white/10 border-l-[#8338EC]",
            error: "bg-[#212529] text-white border-white/10 border-l-[#FB5607]",
            warning: "bg-[#212529] text-white border-white/10 border-l-[#FB5607]",
            info: "bg-[#212529] text-white border-white/10 border-l-[#8338EC]",
          }[toast.type] || "bg-[#212529] text-white border-white/10 border-l-[#8338EC]";

          const iconColor = {
            success: "text-[#8338EC]",
            error: "text-[#FB5607]",
            warning: "text-[#FB5607]",
            info: "text-[#8338EC]",
          }[toast.type] || "text-[#8338EC]";

          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error" || toast.type === "warning"
                ? AlertCircle
                : Info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 px-4 py-3 shadow-xl text-sm animate-toast-enter ${styles}`}
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
              <p className="flex-1 leading-snug text-[#E9ECEF]">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-[#E9ECEF]/60 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
