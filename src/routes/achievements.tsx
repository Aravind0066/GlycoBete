import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { storage } from "@/lib/gameEngine";
import { normalizeAchievementId } from "@/lib/rewardEngine";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — GlycoBete" }] }),
  component: Achievements,
});

const BADGES = [
  { id: "first_glucose_log", icon: "🩸", name: "FIRST CHECK-IN", desc: "Log your first glucose reading" },
  { id: "profile_complete", icon: "✅", name: "PROFILE READY", desc: "Complete your health profile" },
  { id: "seven_day_streak", icon: "🔥", name: "7 DAY STREAK", desc: "Check in for seven days straight" },
  { id: "meal_tracker", icon: "🍽️", name: "MEAL TRACKER", desc: "Log your first AI-analyzed meal" },
  { id: "coach_chat", icon: "💬", name: "COACH CONNECTION", desc: "Ask the AI coach a question" },
  { id: "boss_slayer", icon: "🏆", name: "BOSS SLAYER", desc: "Defeat your first weekly boss" },
  {
    id: "millet_convert",
    icon: "🍚",
    name: "MILLET CONVERT",
    desc: "Log a millet meal after AI suggestion",
  },
  { id: "party_leader", icon: "👨‍👩‍👧", name: "PARTY LEADER", desc: "Add a family member" },
  { id: "data_mage", icon: "📊", name: "DATA MAGE", desc: "Generate your first doctor report" },
  { id: "night_owl", icon: "🌙", name: "NIGHT OWL", desc: "Complete your evening debrief" },
];

function hasBadge(unlocked: string[], badgeId: string) {
  return unlocked.some((id) => normalizeAchievementId(id) === badgeId || id === badgeId);
}

function Achievements() {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  useEffect(() => {
    setUnlocked(storage.getGame().achievements);
  }, []);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="font-display text-lg">ACHIEVEMENTS</h1>
        <p className="text-sm text-slate-400 mt-2">Your legendary moments.</p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {BADGES.map((b) => {
            const open = hasBadge(unlocked, b.id);
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-5 text-center transition-all ${
                  open
                    ? "border-amber-500 bg-slate-800 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-flip-unlock"
                    : "border-slate-700 bg-slate-800 grayscale opacity-60"
                }`}
              >
                <div className="text-4xl">{open ? b.icon : "🔒"}</div>
                <p className="mt-3 font-display text-[9px] text-slate-100">
                  {open ? b.name : "???"}
                </p>
                <p className="mt-2 text-xs text-slate-400">{open ? b.desc : "Locked"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
