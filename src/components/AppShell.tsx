import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, BarChart3, Bot, Pill } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { PageTransition } from "@/components/PageTransition";
import { ThemeToggle, ThemeToggleFab } from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { levelFromXP } from "@/lib/gameEngine";
import type { GameState, UserProfile } from "@/lib/types";

const NAV = [
  { to: "/dashboard", icon: Home, label: "HOME" },
  { to: "/log", icon: Utensils, label: "LOG" },
  { to: "/assistant", icon: Bot, label: "AI" },
  { to: "/insights", icon: BarChart3, label: "STATS" },
  { to: "/meds", icon: Pill, label: "MEDS" },
] as const;

const CLASS_ICON = { warrior: "🗡️", mage: "🔮", healer: "💚" } as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [game, setGame] = useState<GameState | null>(null);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getGame()]).then(([p, g]) => {
      setProfile(p);
      setGame(g);
    });
  }, [loc.pathname]);

  const lvl = game ? levelFromXP(game.totalXP) : null;
  const xpPct =
    game && lvl
      ? Math.min(
          100,
          ((game.totalXP - lvl.xpForCurrent) / (lvl.xpForNext - lvl.xpForCurrent)) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)]">
      <ThemeToggleFab />
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-[var(--theme-border)] bg-[var(--theme-bg)] p-4">
        <div className="mb-4">
          <ThemeToggle />
        </div>
        <div className="mb-6 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--theme-accent)] bg-[var(--theme-bg)] text-2xl">
              {profile ? CLASS_ICON[profile.class] : "❤️"}
            </div>
            <div className="min-w-0">
              <div className="font-display text-[10px] truncate">{profile?.name || "PLAYER"}</div>
              <div className="font-display text-[8px] text-[var(--theme-accent)] mt-1">
                LVL {lvl?.level ?? 1} {lvl?.title ?? "ROOKIE"}
              </div>
              {profile?.mode === "family" && (
                <div className="font-display text-[7px] text-[var(--theme-muted)] mt-1">
                  CARETAKER
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[var(--theme-card-alt)] overflow-hidden">
            <div
              className="h-full bg-[var(--theme-accent)] transition-all duration-1000"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                  active
                    ? "bg-[var(--theme-card)] text-[var(--theme-accent)]"
                    : "text-[var(--theme-muted)] hover:bg-[var(--theme-card)]/50"
                }`}
              >
                <Icon size={18} />
                <span className="font-display text-[10px]">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="md:ml-60 pb-24 md:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--theme-border)] bg-[var(--theme-bg)]">
        <div className="grid grid-cols-5">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                className={`flex flex-col items-center gap-1 py-3 ${
                  active ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)]"
                }`}
              >
                <Icon size={20} />
                <span className="font-display text-[7px] leading-none">{n.label}</span>
                {active && (
                  <span className="h-1 w-1 rounded-full bg-[var(--theme-accent)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
