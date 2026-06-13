import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "@/lib/api";
import { applyTheme, nextTheme, themeMeta } from "@/lib/themes";
import type { AppTheme } from "@/lib/types";

type ThemeContextValue = {
  theme: AppTheme;
  cycleTheme: () => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  label: string;
  icon: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("midnight");

  useEffect(() => {
    api.getProfile().then((profile) => {
      const t = profile?.theme ?? "midnight";
      setThemeState(t);
      applyTheme(t);
    });
  }, []);

  const setTheme = useCallback(async (t: AppTheme) => {
    setThemeState(t);
    applyTheme(t);
    await api.updateTheme(t);
  }, []);

  const cycleTheme = useCallback(async () => {
    const t = nextTheme(theme);
    await setTheme(t);
  }, [theme, setTheme]);

  const meta = themeMeta(theme);

  return (
    <ThemeContext.Provider
      value={{ theme, cycleTheme, setTheme, label: meta.label, icon: meta.icon }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
