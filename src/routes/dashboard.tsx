import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import { storage, levelFromXP, bossProgress, checkBossWeek } from "@/lib/gameEngine";
import { getDashboardMetrics } from "@/lib/glycoBeteMetrics";
import { syncQuestsFromDayState } from "@/lib/questEngine";
import { Activity, Award, Bot, Check, Coins, Flame, Target } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GlycoBete" }] }),
  component: Dashboard,
});

const CLASS_ICON = { warrior: "🗡️", mage: "🔮", healer: "💚" } as const;
const CLASS_BORDER = {
  warrior: "border-red-500",
  mage: "border-blue-500",
  healer: "border-green-500",
} as const;

const TONE_STYLE = {
  good: "border-green-600 bg-green-950/60 text-green-300",
  watch: "border-amber-600 bg-amber-950/60 text-amber-300",
  alert: "border-red-600 bg-red-950/60 text-red-300",
} as const;

function Dashboard() {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!storage.getProfile()) navigate({ to: "/onboarding" });
    checkBossWeek();
    syncQuestsFromDayState();
    setTick(1);
  }, [navigate]);

  if (!tick) return <HeartLoading message="Loading your dashboard..." />;
  const profile = storage.getProfile();
  if (!profile) return <HeartLoading message="Preparing onboarding..." />;
  const game = storage.getGame();
  const lvl = levelFromXP(game.totalXP);
  const xpPct = Math.min(
    100,
    ((game.totalXP - lvl.xpForCurrent) / (lvl.xpForNext - lvl.xpForCurrent)) * 100,
  );
  const today = storage.getToday();
  const boss = bossProgress();
  const bossPct = (boss.inRange / boss.total) * 100;
  const metrics = getDashboardMetrics();

  const lastMeal = today.meals[today.meals.length - 1];
  const flag = (l: string) => (l === "low" ? "🟢 LOW" : l === "high" ? "🔴 HIGH" : "🟡 MEDIUM");
  const hour = new Date().getHours();
  const eveningUnlocked = hour >= 18 || today.meals.length > 0;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-4">
        {/* Character card */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${CLASS_BORDER[profile.class]} bg-slate-900 text-4xl shrink-0`}
            >
              {CLASS_ICON[profile.class]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-sm text-slate-100 truncate">{profile.name}</h1>
              <p className="font-display text-[10px] text-amber-400 mt-2">
                LEVEL {lvl.level} {profile.class.toUpperCase()}
              </p>
              <p className="text-sm text-slate-400 mt-1">{profile.diabetesType}</p>
            </div>
            <div className="w-full md:w-72 space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-display text-[8px] text-amber-400">XP</span>
                  <span className="text-xs text-slate-400">
                    {game.totalXP} / {lvl.xpForNext}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-1000 ease-out"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  <span className="font-display text-[8px] text-amber-400">
                    {game.streak} DAY STREAK
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins size={14} className="text-yellow-400" />
                  <span className="font-display text-[8px] text-yellow-400">
                    {game.healthCoins} COINS
                  </span>
                </div>
              </div>
            </div>
          </div>
          {lvl.next && (
            <p className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-3">
              Next: Level {lvl.next.level} unlocks {lvl.next.title} title
            </p>
          )}
        </section>

        {/* GlycoBete health dashboard */}
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div className={`rounded-2xl border p-5 ${TONE_STYLE[metrics.scoreTone]}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-[9px]">HEALTH SCORE</p>
                <p className="mt-3 font-display text-4xl">{metrics.healthScore}</p>
                <p className="mt-2 text-sm text-slate-300">{metrics.scoreLabel}</p>
              </div>
              <Activity size={42} className="shrink-0 opacity-80" />
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
              <div
                className="h-full rounded-full bg-current transition-all duration-700"
                style={{ width: `${metrics.healthScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-[9px] text-cyan-400">DAILY QUESTS</p>
              <Target size={20} className="text-cyan-400" />
            </div>
            <p className="mt-3 font-display text-2xl text-slate-100">
              {metrics.questProgress.completed}/{metrics.questProgress.total}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-cyan-400 transition-all duration-700"
                style={{ width: `${metrics.questProgress.percent}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {metrics.questProgress.items.slice(0, 3).map((quest) => (
                <div key={quest.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className={quest.done ? "text-slate-200" : "text-slate-500"}>
                    {quest.label}
                  </span>
                  <span className={quest.done ? "text-green-400" : "text-amber-400"}>
                    {quest.done ? "Done" : `+${quest.xp} XP`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-700 bg-slate-800 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-[9px] text-blue-400">AI COACH</p>
              <Bot size={22} className="text-blue-400" />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Ask about food choices, exercise, glucose readings, or what today's pattern means.
            </p>
            <Link
              to="/coach"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-3 font-display text-[10px] text-white transition-all hover:scale-[1.02] active:scale-95"
            >
              OPEN AI COACH
            </Link>
          </div>
        </section>

        {/* Active Quest */}
        {metrics.questProgress.activeDailyQuest && (
          <section className="rounded-2xl border border-cyan-700 bg-slate-700 p-4">
            <p className="font-display text-[8px] text-cyan-400 mb-2">TODAY'S QUEST</p>
            <p className="text-sm text-slate-200">{metrics.questProgress.activeDailyQuest}</p>
            <p className="text-xs text-amber-400 mt-2">COMPLETE DAILY QUESTS FOR BONUS XP</p>
          </section>
        )}

        {/* Today status row */}
        <section className="grid md:grid-cols-3 gap-4">
          <StatusCard>
            <h3 className="font-display text-[10px] text-slate-300 mb-3">MORNING CHECK-IN</h3>
            {today.fastingSugar ? (
              <div>
                <Check className="text-green-500 mb-2" />
                <p className="font-display text-lg text-amber-400">{today.fastingSugar} mg/dL</p>
                <p className="font-display text-[8px] text-amber-400 mt-2">+50 XP EARNED</p>
              </div>
            ) : (
              <Link
                to="/checkin"
                className="block rounded-full bg-blue-600 px-4 py-3 text-center font-display text-[10px] text-white hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                TAP TO CHECK IN
              </Link>
            )}
          </StatusCard>

          <StatusCard>
            <h3 className="font-display text-[10px] text-slate-300 mb-3">
              {today.meals.length} MEALS LOGGED
            </h3>
            {lastMeal ? (
              <div>
                <p className="text-sm text-slate-200 truncate">{lastMeal.description}</p>
                <p className="text-sm mt-2">{flag(lastMeal.glycemicLevel)}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No meals yet today.</p>
            )}
            <Link
              to="/log"
              className="mt-3 block rounded-full bg-amber-500 px-4 py-2 text-center font-display text-[10px] text-slate-900 hover:scale-105 active:scale-95 transition-all"
            >
              + LOG MEAL
            </Link>
          </StatusCard>

          <StatusCard>
            <h3 className="font-display text-[10px] text-slate-300 mb-3">EVENING DEBRIEF</h3>
            {today.eveningSummary ? (
              <p className="text-sm text-slate-200">{today.eveningSummary.patternDetected}</p>
            ) : eveningUnlocked ? (
              <Link
                to="/summary"
                className="block rounded-full bg-cyan-600 px-4 py-3 text-center font-display text-[10px] text-white hover:scale-105 active:scale-95 transition-all"
              >
                GET TODAY'S INSIGHT
              </Link>
            ) : (
              <p className="text-sm text-slate-500">🔒 Unlocks after 6pm</p>
            )}
          </StatusCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-display text-[10px] text-slate-300">RECENT LOGS</p>
              <Link to="/log" className="text-xs text-amber-400 underline-offset-4 hover:underline">
                Add log
              </Link>
            </div>
            {metrics.recentLogs.length ? (
              <div className="space-y-3">
                {metrics.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${TONE_STYLE[log.tone]}`}
                  >
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{log.label}</p>
                      <p className="mt-1 truncate text-xs text-slate-300">{log.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-600 p-6 text-center">
                <p className="text-sm text-slate-400">No logs yet today.</p>
                <Link
                  to="/checkin"
                  className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 font-display text-[9px] text-white"
                >
                  START CHECK-IN
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-display text-[10px] text-slate-300">WEEKLY SUMMARY</p>
              <Award size={18} className="text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                label="Avg fasting"
                value={
                  metrics.weeklySummary.averageFasting
                    ? `${metrics.weeklySummary.averageFasting}`
                    : "-"
                }
              />
              <MiniStat label="In range" value={`${metrics.weeklySummary.daysInRange}/7`} />
              <MiniStat label="Check-ins" value={`${metrics.weeklySummary.checkins}`} />
              <MiniStat label="Meals" value={`${metrics.weeklySummary.mealsLogged}`} />
            </div>
            <Link
              to="/achievements"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-slate-700 px-4 py-3 font-display text-[10px] text-amber-400 transition-all hover:bg-slate-600"
            >
              <Award size={14} /> VIEW ACHIEVEMENTS
            </Link>
          </div>
        </section>

        {/* Boss */}
        <section
          className={`rounded-2xl border-2 p-6 ${boss.defeated ? "bg-amber-950 border-amber-500" : "bg-red-950 border-red-600 animate-boss-pulse"}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-display text-sm text-red-400">⚔️ WEEKLY BOSS</p>
              <p className="font-display text-[10px] text-slate-300 mt-2">THE SUGAR SPIKE</p>
            </div>
            {boss.defeated && (
              <span className="font-display text-xs text-amber-400">🏆 +500 XP</span>
            )}
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-300">
                {boss.inRange}/{boss.total} DAYS IN RANGE
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-700"
                style={{ width: `${bossPct}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {boss.defeated
                ? "🏆 BOSS DEFEATED! Excellent week."
                : "Defeat him before Sunday — keep fasting 70–140."}
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg">{children}</div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-center">
      <p className="font-display text-xl text-amber-400">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{label}</p>
    </div>
  );
}
