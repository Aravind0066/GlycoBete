import { Palette } from "lucide-react";

import { useTheme } from "@/components/ThemeProvider";
import { THEMES } from "@/lib/themes";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, icon, label } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(THEMES[(THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length].id)}
        className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card)] px-3 py-2 text-sm text-[var(--theme-muted)] hover:text-[var(--theme-accent)] transition-colors"
        title={`Theme: ${label}. Click to cycle.`}
      >
        <span className="text-lg">{icon}</span>
        {!compact && <span className="font-display text-[8px] hidden lg:inline">{label.toUpperCase()}</span>}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-3">
      <div className="flex items-center gap-2 mb-3">
        <Palette size={14} className="text-[var(--theme-accent)]" />
        <span className="font-display text-[8px] text-[var(--theme-muted)]">THEME</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`rounded-xl border px-2 py-2 text-left transition-all ${
              theme === t.id
                ? "border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]"
                : "border-[var(--theme-border)] hover:border-[var(--theme-muted)]"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <p className="font-display text-[7px] mt-1 text-[var(--theme-fg)]">{t.label.toUpperCase()}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeToggleFab() {
  const { cycleTheme, icon, label } = useTheme();

  return (
    <button
      type="button"
      onClick={() => cycleTheme()}
      className="fixed top-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--theme-accent)] bg-[var(--theme-card)] text-xl shadow-lg hover:scale-105 active:scale-95 transition-all md:top-6 md:right-6"
      title={`Theme: ${label}. Tap to cycle.`}
      aria-label={`Change theme, current: ${label}`}
    >
      {icon}
    </button>
  );
}
