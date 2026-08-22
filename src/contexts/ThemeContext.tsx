import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme";

// ── Helpers ──

function getStored(): Theme {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
  } catch {
    return "system";
  }
}

function setStored(theme: Theme): void {
  try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* ok */ }
}

function setThemeColor(dark: boolean): void {
  const color = dark ? "#111827" : "#f9fafb";
  const meta = document.getElementById("theme-color-meta") as HTMLMetaElement | null;
  if (meta) meta.content = color;

  const apple = document.getElementById("apple-status-bar-meta") as HTMLMetaElement | null;
  if (apple) apple.content = dark ? "black-translucent" : "default";
}

// ── Provider ──

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "system" : getStored(),
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (mode: Theme) => {
      const dark = mode === "dark" || (mode === "system" && mq.matches);
      root.classList.toggle("dark", dark);
      setIsDarkMode(dark);
      setThemeColor(dark);
    };

    apply(theme);
    setStored(theme);

    if (theme === "system") {
      const onChange = () => apply("system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
