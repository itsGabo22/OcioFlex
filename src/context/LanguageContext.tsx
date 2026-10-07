"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Translations } from "@/locales/types";
import { es } from "@/locales/es";
import { en } from "@/locales/en";

type Language = "es" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ocioflex-lang");
      if (stored === "en") {
        setLanguageState("en");
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("ocioflex-lang", lang);
    } catch (e) {
      // Ignore
    }
  };

  const t = language === "en" ? en : es;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
};
