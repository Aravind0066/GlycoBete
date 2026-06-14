import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import {
  storage,
  bossProgress,
} from "@/lib/gameEngine";
import { rewardEveningSummary, rewardBossDefeat } from "@/lib/rewardEngine";
import { analyzeDay, type DailySummary } from "@/lib/geminiApi";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "Today's Debrief - GlycoBete" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailySummary | null>(null);
  const [xpBreakdown, setXpBreakdown] = useState<{ label: string; xp: number }[]>([]);
  const [total, setTotal] = useState(0);
  const boss = bossProgress();

  const updateXpBreakdown = () => {
    const today = storage.getToday();
    const meals = today.meals.reduce((s, m) => s + m.xpEarned, 0);
    const breakdown = [
      ...(today.fastingSugar ? [{ label: "Morning check-in", xp: 50 }] : []),
      ...(today.meals.length ? [{ label: `Meal logs (${today.meals.length})`, xp: meals }] : []),
      ...(storage.getGame().streak >= 7 ? [{ label: "Streak bonus", xp: 25 }] : []),
      { label: "Evening summary", xp: 40 },
    ];

    setXpBreakdown(breakdown);
    setTotal(breakdown.reduce((s, b) => s + b.xp, 0));
  };

  useEffect(() => {
    (async () => {
      const profile = storage.getProfile();
      const today = storage.getToday();

      if (today.eveningSummary) {
        setData({
          control_status: today.eveningSummary.controlStatus,
          pattern_detected: today.eveningSummary.patternDetected,
          tomorrows_quest: today.eveningSummary.tomorrowsQuest,
          boss_progress: today.eveningSummary.bossProgress,
        });
        updateXpBreakdown();
        setLoading(false);
        return;
      }

      const res = await analyzeDay({
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
      storage.saveDay(today);

      const game = storage.getGame();
      game.activeQuest = res.tomorrows_quest;
      storage.setGame(game);

      rewardEveningSummary();
      const bossState = bossProgress();
      if (bossState.defeated) rewardBossDefeat();

      updateXpBreakdown();
      setData(res);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <HeartLoading />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center">
            <h1 className="font-display text-sm text-slate-100">SUMMARY UNAVAILABLE</h1>
            <p className="mt-3 text-sm text-slate-400">
              We could not generate today's debrief. Try again in a moment.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const badge = data.control_status;
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
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        <div>
          <h1 className="font-display text-lg">TODAY'S DEBRIEF</h1>
          <p className="text-sm text-slate-400 mt-2">GlycoBete analyzed your full day.</p>
        </div>

        <div className={`rounded-2xl border-2 p-5 text-center animate-slide-up ${badgeCls}`}>
          <p className="font-display text-sm">{badgeText}</p>
        </div>

        <Card title="PATTERN DETECTED" color="text-blue-400">
          <p className="text-sm text-slate-300">{data.pattern_detected}</p>
        </Card>

        <Card
          title="TOMORROW'S QUEST"
          color="text-cyan-400"
          border="border-cyan-600"
          bg="bg-slate-700"
        >
          <p className="text-sm text-slate-200">{data.tomorrows_quest}</p>
          <p className="mt-2 text-xs text-amber-400">EARN +100 BONUS XP IF COMPLETED</p>
        </Card>

        <Card title="TODAY'S XP" color="text-amber-400" bg="bg-amber-950" border="border-amber-600">
          <ul className="space-y-2 text-sm text-slate-200">
            {xpBreakdown.map((b, i) => (
              <li key={i} className="flex justify-between">
                <span>{b.label}</span>
                <span className="text-amber-400">+{b.xp} XP</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-display text-2xl text-amber-400 text-center">{total} XP EARNED</p>
        </Card>

        <Card title="BOSS PROGRESS" color="text-red-400" bg="bg-red-950" border="border-red-700">
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-700"
              style={{ width: `${(boss.inRange / 7) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Today counted! {boss.inRange}/7 days complete.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  color,
  children,
  bg = "bg-slate-800",
  border = "border-slate-700",
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
