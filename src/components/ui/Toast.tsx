"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type Tone = "info" | "success" | "error" | "pending";

interface Toast {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

type Push = (t: Omit<Toast, "id">) => void;

const ToastContext = createContext<Push>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const TONE_ICON = { info: "info", success: "check", error: "alert", pending: "refresh" } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback<Push>((t) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.tone === "error" ? 7000 : 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-20 z-[70] flex flex-col items-end gap-2 md:bottom-6 md:right-6 md:left-auto"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="panel glass rise-in pointer-events-auto flex w-full max-w-sm items-start gap-3 px-4 py-3"
          >
            <span
              className={`mt-0.5 ${t.tone === "error" ? "text-down" : t.tone === "success" ? "text-bright" : "text-electric"}`}
            >
              <Icon name={TONE_ICON[t.tone]} size={18} className={t.tone === "pending" ? "animate-spin" : ""} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[0.8125rem] text-ink-2">{t.description}</p>}
            </div>
            <button
              className="-mr-1 rounded p-1 text-ink-3 hover:text-ink"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
