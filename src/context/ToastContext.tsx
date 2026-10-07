"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ToastType = "default" | "success" | "error";

interface Toast {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastContextProps {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "default") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-space-lg right-space-lg z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-space-md py-space-sm rounded-xl shadow-md border ${
              t.type === "success"
                ? "bg-accent-primary text-on-accent-primary border-accent-primary"
                : t.type === "error"
                ? "bg-error text-on-error border-error"
                : "bg-surface-container-highest text-on-surface border-outline-variant"
            } transform transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in`}
          >
            {t.type === "success" && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
            {t.type === "error" && <span className="material-symbols-outlined text-[18px]">error</span>}
            {t.type === "default" && <span className="material-symbols-outlined text-[18px]">info</span>}
            <span className="font-body-compact text-body-compact font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
