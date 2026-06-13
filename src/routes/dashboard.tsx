import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AnimatedCard } from "@/components/AnimatedCard";
import { AppShell } from "@/components/AppShell";
import { EmergencyPanel } from "@/components/EmergencyPanel";
import { GlassCard, StaggerChildren, StaggerItem } from "@/components/GlassCard";
import { PageLoader } from "@/components/PageLoader";
import { ProgressRing } from "@/components/ProgressRing";
import { api } from "@/lib/api";
import { consumeBootComplete } from "@/lib/bootSession";
import { greetingForHour } from "@/lib/healthAnalytics";
import {
  bossProgressFromDays,
  levelFromXP,
  weekStart,
  dateKey,
} from "@/lib/gameEngine";
import type { DayLog, GameState, HealthMetrics, RiskPrediction, UserProfile } from "@/lib/types";
import {
  Flame,
  Coins,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Dumbbell,
  Pill,
  Activity,
} from "lucide-react";

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

const RISK_COLOR = {
  low: "text-green-400 bg-green-900/30 border-green-500/40",
  medium: "text-amber-400 bg-amber-900/30 border-amber-500/40",
  high: "text-red-400 bg-red-900/30 border-red-500/40",
};

function Dashboard() {
  const navigate = useNavigate();
  const justBooted = useRef(consumeBootComplete()).current;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [today, setToday] = useState<DayLog | null>(null);
  const [weekDays, setWeekDays] = useState<Record<string, DayLog>>({});
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [risk, setRisk] = useState<RiskPrediction | null>(null);

  useEffect(() => {
    (async () => {
      const p = await api.getProfile();
      if (!p) {
        navigate({ to: "/onboarding" });
        return;
      }
      await api.checkBossWeek(weekStart());
      const [g, t, days, health, bossResult] = await Promise.all([
        api.getGame(),
        api.getToday(),
        api.getDaysInRange(weekStart(), dateKey(new Date())),
        api.getHealthDashboard(),
        api.evaluateBoss(),
      ]);

      if (bossResult.rewarded) {
        toast.success(`🏆 Boss defeated! +${bossResult.xpGranted} XP earned!`);
      }

      setProfile(p);
      setGame(bossResult.game);
      setToday(t);
      setWeekDays(days);
      setMetrics(health.metrics);
      setRisk(health.risk);
      setLoading(false);
    })();
  }, [navigate]);

  const ready = !dataLoading && profile && game && today && metrics;

  return (
    <PageLoader
      loading={!ready}
      minMs={justBooted ? 0 : 1400}
      message="Loading your dashboard..."
      shell={false}
      themeFab
    >
      {ready ? (
        <DashboardContent
          profile={profile}
          game={game}
          today={today}
          metrics={metrics}
          risk={risk}
          weekDays={weekDays}
          setProfile={setProfile}
        />
      ) : null}
    </PageLoader>
  );
}

function DashboardContent({
  profile,
  game,
  today,
  metrics,
  risk,
  weekDays,
  setProfile,
}: {
  profile: UserProfile;
  game: GameState;
  today: DayLog;
  metrics: HealthMetrics;
  risk: RiskPrediction | null;
  weekDays: Record<string, DayLog>;
  setProfile: (p: UserProfile) => void;
}) {
  const lvl = levelFromXP(game.totalXP);
  const xpPct = Math.min(
    100,
    ((game.totalXP - lvl.xpForCurrent) / (lvl.xpForNext - lvl.xpForCurrent)) * 100,
  );
  const boss = bossProgressFromDays(weekDays);
  const bossPct = (boss.inRange / boss.total) * 100;
  const lastMeal = today.meals[today.meals.length - 1];
  const flag = (l: string) => (l === "low" ? "🟢 LOW" : l === "high" ? "🔴 HIGH" : "🟡 MEDIUM");
  const hour = new Date().getHours();
  const eveningUnlocked = hour >= 18 || today.meals.length > 0;
  const greeting = greetingForHour(hour);
  const TrendIcon =
    metrics.glucoseTrend === "improving"
      ? TrendingUp
      : metrics.glucoseTrend === "worsening"
        ? TrendingDown
        : Minus;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-5">
        {/* Personalized greeting */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="font-display text-sm md:text-base text-[var(--theme-fg)]">
              {greeting}, {profile.name.split(" ")[0]}
            </h1>
            <p className="text-sm text-[var(--theme-muted)] mt-1 flex items-center gap-2">
              <TrendIcon
                size={14}
                className={
                  metrics.glucoseTrend === "improving"
                    ? "text-green-400"
                    : metrics.glucoseTrend === "worsening"
                      ? "text-red-400"
                      : "text-[var(--theme-muted)]"
                }
              />
              {metrics.monthImprovement > 0
                ? `Your glucose improved ${metrics.monthImprovement}% this month`
                : metrics.glucoseTrend === "stable"
                  ? "Your glucose is holding steady — keep it up"
                  : "Let's work on bringing those numbers down"}
            </p>
          </div>
          <EmergencyPanel profile={profile} onUpdate={setProfile} />
        </motion.div>

        {/* Hero stats row */}
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StaggerItem>
            <MetricCard
              icon={Activity}
              value={metrics.currentGlucose ?? "—"}
              unit="mg/dL"
              label="CURRENT"
              color={
                metrics.currentGlucose && metrics.currentGlucose > 140
                  ? "text-red-400"
                  : "text-[var(--theme-accent)]"
              }
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              icon={TrendingUp}
              value={metrics.weeklyAverage ?? "—"}
              unit="mg/dL"
              label="WEEKLY AVG"
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              icon={Droplets}
              value={metrics.hba1cEstimate ?? "—"}
              unit="%"
              label="HbA1c EST."
            />
          </StaggerItem>
          <StaggerItem>
            <MetricCard
              icon={Pill}
              value={`${metrics.medicationAdherence}%`}
              label="MED ADHERENCE"
            />
          </StaggerItem>
        </StaggerChildren>

        {/* Health score + profile */}
        <AnimatedCard delay={0.1}>
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <ProgressRing
                value={metrics.healthScore}
                label="HEALTH"
                sublabel="SCORE"
                color={
                  metrics.healthScore >= 80
                    ? "#22c55e"
                    : metrics.healthScore >= 60
                      ? "var(--theme-accent)"
                      : "#ef4444"
                }
              />
              <div className="flex-1 w-full">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-4 ${CLASS_BORDER[profile.class]} bg-[var(--theme-bg)] text-3xl shrink-0`}
                  >
                    {CLASS_ICON[profile.class]}
                  </motion.div>
                  <div>
                    <p className="font-display text-[10px] text-[var(--theme-accent)]">
                      LEVEL {lvl.level} {profile.class.toUpperCase()}
                    </p>
                    <p className="text-sm text-[var(--theme-muted)]">
                      {profile.diabetesType}
                      {profile.mode === "family" ? " · Caretaker" : ""}
                    </p>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--theme-card-alt)] overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--theme-accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex gap-4 mt-3">
                  <span className="flex items-center gap-1.5 font-display text-[8px] text-[var(--theme-accent)]">
                    <Flame size={12} /> {game.streak} STREAK
                  </span>
                  <span className="flex items-center gap-1.5 font-display text-[8px] text-yellow-400">
                    <Coins size={12} /> {game.healthCoins} COINS
                  </span>
                  <span className="flex items-center gap-1.5 text-[8px] text-[var(--theme-muted)]">
                    <Dumbbell size={12} /> {metrics.exerciseMinutes}min exercise
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedCard>

        {/* Risk prediction */}
        {risk && (
          <AnimatedCard delay={0.15}>
            <div className="glass-card rounded-2xl border border-[var(--theme-cyan)]/30 p-5">
              <p className="font-display text-[10px] text-[var(--theme-cyan)] mb-3">
                🔮 RISK PREDICTION — TOMORROW
              </p>
              <div className="flex flex-wrap gap-3 mb-3">
                <RiskBadge label="Hypo" level={risk.hypoglycemiaRisk} />
                <RiskBadge label="Hyper" level={risk.hyperglycemiaRisk} />
              </div>
              <p className="text-sm text-[var(--theme-fg)]">{risk.summary}</p>
              <ul className="mt-2 text-xs text-[var(--theme-muted)] space-y-1">
                {risk.factors.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          </AnimatedCard>
        )}

        {game.activeQuest && (
          <AnimatedCard delay={0.18}>
            <motion.div
              animate={{ boxShadow: ["0 0 0 0 rgba(8,145,178,0)", "0 0 20px 2px rgba(8,145,178,0.3)", "0 0 0 0 rgba(8,145,178,0)"] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="rounded-2xl border border-[var(--theme-cyan)] bg-[var(--theme-card-alt)] p-4"
            >
              <p className="font-display text-[8px] text-[var(--theme-cyan)] mb-2">📜 TODAY'S QUEST</p>
              <p className="text-sm text-[var(--theme-fg)]">{game.activeQuest}</p>
              <p className="text-xs text-[var(--theme-accent)] mt-2">COMPLETE FOR +100 XP</p>
            </motion.div>
          </AnimatedCard>
        )}

        {/* Daily actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <AnimatedCard delay={0.2}>
            <StatusCard>
              <h3 className="font-display text-[10px] text-[var(--theme-muted)] mb-3">MORNING CHECK-IN</h3>
              {today.fastingSugar ? (
                <div>
                  <Check className="text-green-500 mb-2" />
                  <p className="font-display text-lg text-[var(--theme-accent)]">{today.fastingSugar} mg/dL</p>
                  <p className="font-display text-[8px] text-[var(--theme-accent)] mt-2">+50 XP EARNED</p>
                </div>
              ) : (
                <Link
                  to="/checkin"
                  className="block rounded-full bg-[var(--theme-primary)] px-4 py-3 text-center font-display text-[10px] text-white hover:scale-105 active:scale-95 transition-all animate-pulse"
                >
                  TAP TO CHECK IN
                </Link>
              )}
            </StatusCard>
          </AnimatedCard>

          <AnimatedCard delay={0.25}>
            <StatusCard>
              <h3 className="font-display text-[10px] text-[var(--theme-muted)] mb-3">{today.meals.length} MEALS LOGGED</h3>
              {lastMeal ? (
                <div>
                  <p className="text-sm text-[var(--theme-fg)] truncate">{lastMeal.description}</p>
                  <p className="text-sm mt-2">{flag(lastMeal.glycemicLevel)}</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--theme-muted)]">No meals yet today.</p>
              )}
              <Link
                to="/log"
                className="mt-3 block rounded-full bg-[var(--theme-accent)] px-4 py-2 text-center font-display text-[10px] text-slate-900 hover:scale-105 active:scale-95 transition-all"
              >
                + LOG MEAL
              </Link>
            </StatusCard>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <StatusCard>
              <h3 className="font-display text-[10px] text-[var(--theme-muted)] mb-3">EVENING DEBRIEF</h3>
              {today.eveningSummary ? (
                <p className="text-sm text-[var(--theme-fg)]">{today.eveningSummary.patternDetected}</p>
              ) : eveningUnlocked ? (
                <Link
                  to="/summary"
                  className="block rounded-full bg-[var(--theme-cyan)] px-4 py-3 text-center font-display text-[10px] text-white hover:scale-105 active:scale-95 transition-all"
                >
                  GET TODAY'S INSIGHT
                </Link>
              ) : (
                <p className="text-sm text-[var(--theme-muted)]">🔒 Unlocks after 6pm</p>
              )}
            </StatusCard>
          </AnimatedCard>
        </div>

        {/* Quick links */}
        <AnimatedCard delay={0.32}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: "/assistant", label: "AI CHAT", emoji: "🤖" },
              { to: "/meds", label: "MEDS", emoji: "💊" },
              { to: "/insights", label: "STATS", emoji: "📊" },
              { to: "/achievements", label: "WINS", emoji: "🏆" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="glass-card rounded-xl p-4 text-center hover:border-[var(--theme-accent)]/40 transition-colors"
              >
                <span className="text-xl">{link.emoji}</span>
                <p className="font-display text-[8px] text-[var(--theme-muted)] mt-2">{link.label}</p>
              </Link>
            ))}
          </div>
        </AnimatedCard>

        {/* Boss */}
        <AnimatedCard delay={0.35}>
          <motion.section
            animate={
              boss.defeated || game.bossDefeated
                ? {}
                : { boxShadow: ["0 0 0 0 rgba(220,38,38,0.4)", "0 0 24px 6px rgba(220,38,38,0.3)", "0 0 0 0 rgba(220,38,38,0.4)"] }
            }
            transition={{ repeat: Infinity, duration: 2 }}
            className={`rounded-2xl border-2 p-6 ${boss.defeated || game.bossDefeated ? "bg-amber-950 border-amber-500" : "bg-red-950 border-red-600"}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-display text-sm text-red-400">⚔️ WEEKLY BOSS</p>
                <p className="font-display text-[10px] text-[var(--theme-muted)] mt-2">THE SUGAR SPIKE</p>
              </div>
              {(boss.defeated || game.bossDefeated) && (
                <span className="font-display text-xs text-[var(--theme-accent)]">🏆 +500 XP</span>
              )}
            </div>
            <div className="h-3 w-full rounded-full bg-[var(--theme-bg)] overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: 0 }}
                animate={{ width: `${bossPct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="mt-3 text-sm text-[var(--theme-muted)]">
              {boss.inRange}/{boss.total} days in range (70–140 mg/dL)
            </p>
          </motion.section>
        </AnimatedCard>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  value,
  unit,
  label,
  color = "text-[var(--theme-accent)]",
}: {
  icon: typeof Activity;
  value: string | number;
  unit?: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 text-center">
      <Icon size={16} className={`mx-auto mb-2 ${color}`} />
      <p className={`font-display text-lg md:text-xl ${color}`}>
        {value}
        {unit && <span className="text-[8px] ml-0.5">{unit}</span>}
      </p>
      <p className="text-[9px] text-[var(--theme-muted)] mt-1">{label}</p>
    </div>
  );
}

function RiskBadge({ label, level }: { label: string; level: "low" | "medium" | "high" }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${RISK_COLOR[level]}`}>
      {label}: {level.toUpperCase()}
    </span>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5 shadow-lg h-full">
      {children}
    </div>
  );
}
