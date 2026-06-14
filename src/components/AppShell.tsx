import { Link, useLocation } from "@tanstack/react-router";
import { Home, Utensils, BarChart3, Users, Trophy, Bot } from "lucide-react";
import { storage, levelFromXP } from "@/lib/gameEngine";
import { useEffect, useState, type ReactNode } from "react";

const NAV = [
  { to: "/dashboard", icon: Home, label: "HOME" },
  { to: "/log", icon: Utensils, label: "LOG" },
  { to: "/coach", icon: Bot, label: "AI" },
  { to: "/insights", icon: BarChart3, label: "STATS" },
  { to: "/party", icon: Users, label: "PARTY" },
  { to: "/achievements", icon: Trophy, label: "WINS" },
] as const;

const CLASS_ICON = { warrior: "🗡️", mage: "🔮", healer: "💚" } as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const profile = mounted ? storage.getProfile() : null;
  const game = mounted ? storage.getGame() : null;
  const lvl = game ? levelFromXP(game.totalXP) : null;
  const xpPct =
    game && lvl
      ? Math.min(
          100,
          ((game.totalXP - lvl.xpForCurrent) / (lvl.xpForNext - lvl.xpForCurrent)) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-slate-700 bg-slate-900 p-4">
        <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-900 text-2xl">
              {profile ? CLASS_ICON[profile.class as keyof typeof CLASS_ICON] : "❤️"}
            </div>
            <div className="min-w-0">
              <div className="font-display text-[10px] truncate">{profile?.name || "PLAYER"}</div>
              <div className="font-display text-[8px] text-amber-400 mt-1">
                LVL {lvl?.level ?? 1} {lvl?.title ?? "ROOKIE"}
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-1000"
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
                className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                  active ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                <Icon size={18} />
                <span className="font-display text-[10px]">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="md:ml-60 pb-24 md:pb-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-700 bg-slate-900">
        <div className="grid grid-cols-6">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-1 py-3 ${
                  active ? "text-amber-400" : "text-slate-500"
                }`}
              >
                <Icon size={20} />
                <span className="font-display text-[7px] leading-none">{n.label}</span>
                {active && <span className="h-1 w-1 rounded-full bg-amber-400" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
