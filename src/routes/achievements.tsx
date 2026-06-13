import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — GlycoBete" }] }),
  component: Achievements,
});

const BADGES = [
  { id: "first_blood", name: "FIRST BLOOD", icon: "🍽️", desc: "Logged your first meal" },
  { id: "week_warrior", name: "WEEK WARRIOR", icon: "🔥", desc: "7-day check-in streak" },
  { id: "millet_convert", name: "MILLET CONVERT", icon: "🌾", desc: "Logged a millet meal" },
  { id: "night_owl", name: "NIGHT OWL", icon: "🌙", desc: "Completed evening debrief" },
  { id: "party_leader", name: "PARTY LEADER", icon: "👥", desc: "Invited a party member" },
  { id: "data_mage", name: "DATA MAGE", icon: "📊", desc: "Generated doctor report" },
  { id: "boss_slayer", name: "BOSS SLAYER", icon: "⚔️", desc: "Defeated weekly boss" },
  { id: "legend", name: "LEGEND", icon: "👑", desc: "Reached level 6" },
];

function Achievements() {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    api.getGame().then((g) => setUnlocked(g.achievements));
  }, []);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="font-display text-lg">ACHIEVEMENTS</h1>
        <p className="text-sm text-[var(--theme-muted)] mt-2">Your legendary moments.</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const open = unlocked.includes(b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-5 text-center transition-all ${
                  open
                    ? "border-[var(--theme-accent)] bg-[var(--theme-card)] shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-flip-unlock"
                    : "border-[var(--theme-border)] bg-[var(--theme-card)] grayscale opacity-60"
                }`}
              >
                <div className="text-4xl">{open ? b.icon : "🔒"}</div>
                <p className="mt-3 font-display text-[9px] text-[var(--theme-fg)]">
                  {open ? b.name : "???"}
                </p>
                <p className="mt-2 text-xs text-[var(--theme-muted)]">{open ? b.desc : "Locked"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
