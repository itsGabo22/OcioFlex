"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeMode = "foco" | "ocio";

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("foco");

  useEffect(() => {
    if (mode === "ocio") {
      document.body.classList.add("theme-ocio");
    } else {
      document.body.classList.remove("theme-ocio");
    }
  }, [mode]);

  const toggleMode = () => setMode((prev) => (prev === "foco" ? "ocio" : "foco"));

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
