"use client";

import React from "react";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme } from "@/theme/ThemeContext";

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { mode, setMode } = useTheme();

  return (
    <div className="flex flex-col flex-1 w-full max-w-[800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-space-2xl">
      <header className="w-full flex flex-col gap-space-sm mb-space-xl">
        <h1 className="font-display-lg text-display-lg text-on-surface font-bold tracking-tight">
          {t.settings.title}
        </h1>
      </header>

      <section className="flex flex-col gap-space-xl">
        <div className="flex flex-col gap-space-md">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold tracking-wide">
            {t.settings.language}
          </h2>
          <div className="flex flex-col sm:flex-row gap-space-sm">
            <button
              onClick={() => setLanguage("es")}
              className={`p-space-md rounded-2xl border transition-all text-left flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                language === "es"
                  ? "bg-accent-container border-accent-primary shadow-sm"
                  : "bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <span className={`font-title-md text-title-md ${language === "es" ? "text-on-accent-container font-bold" : ""}`}>
                {t.settings.spanish}
              </span>
              {language === "es" && (
                <span className="material-symbols-outlined text-accent-primary">check_circle</span>
              )}
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`p-space-md rounded-2xl border transition-all text-left flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                language === "en"
                  ? "bg-accent-container border-accent-primary shadow-sm"
                  : "bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <span className={`font-title-md text-title-md ${language === "en" ? "text-on-accent-container font-bold" : ""}`}>
                {t.settings.english}
              </span>
              {language === "en" && (
                <span className="material-symbols-outlined text-accent-primary">check_circle</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-space-md">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold tracking-wide">
            {t.settings.theme}
          </h2>
          <div className="flex flex-col sm:flex-row gap-space-sm">
            <button
              onClick={() => setMode("foco")}
              className={`p-space-md rounded-2xl border transition-all text-left flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                mode === "foco"
                  ? "bg-surface-container-highest border-primary text-on-surface shadow-sm"
                  : "bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${mode === "foco" ? "text-primary" : ""}`}>bolt</span>
                <span className={`font-title-md text-title-md ${mode === "foco" ? "font-bold" : ""}`}>
                  {t.settings.foco}
                </span>
              </div>
              {mode === "foco" && (
                <span className="material-symbols-outlined text-primary">check_circle</span>
              )}
            </button>
            <button
              onClick={() => setMode("ocio")}
              className={`p-space-md rounded-2xl border transition-all text-left flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                mode === "ocio"
                  ? "bg-surface-container-highest border-tertiary text-on-surface shadow-sm"
                  : "bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${mode === "ocio" ? "text-tertiary" : ""}`}>sports_esports</span>
                <span className={`font-title-md text-title-md ${mode === "ocio" ? "font-bold" : ""}`}>
                  {t.settings.ocio}
                </span>
              </div>
              {mode === "ocio" && (
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
