"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Mode = "light" | "dark" | "red";

const ThemeContext = createContext({
  mode: "light" as Mode,
  toggleDark: () => {},
  toggleRed: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Mode | null;
    if (saved === "dark" || saved === "red") {
      setMode(saved);
      applyMode(saved);
    }
  }, []);

  function applyMode(m: Mode) {
    const el = document.documentElement.classList;
    el.remove("dark", "red-light");
    if (m === "dark") el.add("dark");
    if (m === "red") el.add("red-light");
  }

  function toggleDark() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
    localStorage.setItem("theme", next);
  }

  function toggleRed() {
    const next = mode === "red" ? "light" : "red";
    setMode(next);
    applyMode(next);
    localStorage.setItem("theme", next);
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleDark, toggleRed }}>
      {children}
    </ThemeContext.Provider>
  );
}
