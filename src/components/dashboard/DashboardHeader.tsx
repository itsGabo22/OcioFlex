"use client";

import React from "react";
import { useTranslation } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

export const DashboardHeader = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const handleStartSession = () => {
    toast(t.feedback.sessionStarted, "success");
    router.push("/deep-work");
  };

  const handleToday = () => {
    toast(t.feedback.featureUnavailable, "default");
  };

  return (
    <header className="w-full flex flex-col gap-space-sm mb-space-xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-code-inline text-code-inline text-on-surface-variant uppercase">{t.dashboard.alignment}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface font-bold tracking-tight">{t.dashboard.overview}</h1>
        </div>
        <div className="flex items-center gap-space-sm">
          <button 
            onClick={handleToday}
            className="h-9 px-4 rounded bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-body-compact text-body-compact font-medium shadow-sm inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>{t.common.today}</span>
          </button>
          <button 
            onClick={handleStartSession}
            className="h-9 px-4 rounded bg-accent-primary text-on-accent-primary font-body-compact text-body-compact font-semibold shadow-sm inline-flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>{t.common.startSession}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
