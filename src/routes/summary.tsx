import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageLoader } from "@/components/PageLoader";
import { api } from "@/lib/api";
import type { DailySummary } from "@/lib/geminiApi";
import {
  bossProgressFromDays,
  weekStart,
  dateKey,
  XP_REWARDS,
} from "@/lib/gameEngine";
import type { DayLog } from "@/lib/types";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "Today's Debrief - GlycoBete" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailySummary | null>(null);
  const [xpBreakdown, setXpBreakdown] = useState<{ label: string; xp: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [boss, setBoss] = useState({ inRange: 0, total: 7, defeated: false });

  useEffect(() => {
    (async () => {
      const profile = await api.getProfile();
      const today = await api.getToday();
      const weekDays = await api.getDaysInRange(weekStart(), dateKey(new Date()));
      setBoss(bossProgressFromDays(weekDays));

      const buildBreakdown = (t: DayLog, streak: number) => {
        const meals = t.meals.reduce((s, m) => s + m.xpEarned, 0);
        const breakdown = [
          ...(t.fastingSugar ? [{ label: "Morning check-in", xp: 50 }] : []),
          ...(t.meals.length ? [{ label: `Meal logs (${t.meals.length})`, xp: meals }] : []),
          ...(streak >= 7 ? [{ label: "Streak bonus", xp: 25 }] : []),
          { label: "Evening summary", xp: 40 },
        ];
        setXpBreakdown(breakdown);
        setTotal(breakdown.reduce((s, b) => s + b.xp, 0));
      };

      if (today.eveningSummary) {
        setData({
          control_status: today.eveningSummary.controlStatus,
          pattern_detected: today.eveningSummary.patternDetected,
          tomorrows_quest: today.eveningSummary.tomorrowsQuest,
          boss_progress: today.eveningSummary.bossProgress,
        });
        const game = await api.getGame();
        buildBreakdown(today, game.streak);
        setLoading(false);
        return;
      }

      const res = await api.analyzeDay({
        name: profile?.name ?? "",
        diabetesType: profile?.diabetesType ?? "Type 2",
        fasting: today.fastingSugar,
        meals: today.meals.map((m) => ({
          description: m.description,
          glycemicLevel: m.glycemicLevel,
        })),
        symptoms: today.symptoms,
        medsTaken: today.medsTaken,
      });

      today.eveningSummary = {
        controlStatus: res.control_status,
        patternDetected: res.pattern_detected,
        tomorrowsQuest: res.tomorrows_quest,
        bossProgress: res.boss_progress,
      };
      await api.saveDay(today);
      await api.setActiveQuest(res.tomorrows_quest);
      await api.grantXP(XP_REWARDS.evening_summary);
      await api.unlockAchievement("night_owl");

      const questResult = await api.completeQuest();
      if (questResult.completed) {
        toast.success(`Quest completed! +${questResult.xpGranted} XP`);
      }

      const game = await api.getGame();
      buildBreakdown(today, game.streak);
      setData(res);
      setLoading(false);
    })();
  }, []);

  if (!loading && !data) {
    return (
      <PageLoader loading={false}>
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-6 text-center">
            <h1 className="font-display text-sm text-[var(--theme-fg)]">SUMMARY UNAVAILABLE</h1>
            <p className="mt-3 text-sm text-[var(--theme-muted)]">
              We could not generate today's debrief. Try again in a moment.
            </p>
          </div>
        </div>
      </PageLoader>
    );
  }

  const badge = data?.control_status ?? "watch_out";
  const badgeCls = {
    controlled: "bg-green-900 border-green-500 text-green-300",
    watch_out: "bg-amber-900 border-amber-500 text-amber-300",
    alert: "bg-red-900 border-red-500 text-red-300",
  }[badge];
  const badgeText = {
    controlled: "CONTROLLED",
    watch_out: "WATCH OUT",
    alert: "ALERT",
  }[badge];

  return (
    <PageLoader loading={loading} message="Preparing your debrief..." minMs={1400}>
      {data && (
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <div>
          <h1 className="font-display text-lg">TODAY'S DEBRIEF</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-2">Gemini analyzed your full day.</p>
        </div>

        <div className={`rounded-2xl border-2 p-5 text-center animate-slide-up ${badgeCls}`}>
          <p className="font-display text-sm">{badgeText}</p>
        </div>

        <Card title="PATTERN DETECTED" color="text-blue-400">
          <p className="text-sm text-[var(--theme-muted)]">{data.pattern_detected}</p>
        </Card>

        <Card title="TOMORROW'S QUEST" color="text-[var(--theme-cyan)]" border="border-[var(--theme-cyan)]">
          <p className="text-sm text-[var(--theme-fg)]">{data.tomorrows_quest}</p>
          <p className="mt-2 text-xs text-[var(--theme-accent)]">EARN +100 BONUS XP IF COMPLETED</p>
        </Card>

        <Card title="TODAY'S XP" color="text-[var(--theme-accent)]" bg="bg-amber-950" border="border-amber-600">
          <ul className="space-y-2 text-sm text-[var(--theme-fg)]">
            {xpBreakdown.map((b, i) => (
              <li key={i} className="flex justify-between">
                <span>{b.label}</span>
                <span className="text-[var(--theme-accent)]">+{b.xp} XP</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-display text-2xl text-[var(--theme-accent)] text-center">
            {total} XP EARNED
          </p>
        </Card>

        <Card title="BOSS PROGRESS" color="text-red-400" bg="bg-red-950" border="border-red-700">
          <div className="h-3 w-full bg-[var(--theme-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${(boss.inRange / 7) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-[var(--theme-muted)]">
            Today counted! {boss.inRange}/7 days complete.
          </p>
        </Card>
      </div>
      )}
    </PageLoader>
  );
}

function Card({
  title,
  color,
  children,
  bg = "bg-[var(--theme-card)]",
  border = "border-[var(--theme-border)]",
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  bg?: string;
  border?: string;
}) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-5 animate-slide-up`}>
      <p className={`font-display text-[10px] mb-3 ${color}`}>{title}</p>
      {children}
    </div>
  );
}
