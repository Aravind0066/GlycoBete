import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import {
  storage,
  grantXP,
  updateStreakOnCheckin,
  XP_REWARDS,
  unlockAchievement,
} from "@/lib/gameEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/checkin")({
  head: () => ({ meta: [{ title: "Morning Check-In — GlycoBete" }] }),
  component: Checkin,
});

const SYMPTOMS = [
  "Dizziness",
  "Sweating",
  "Frequent urination",
  "Fatigue",
  "Blurred vision",
  "Chest pain",
  "None",
];

function Checkin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [sleep, setSleep] = useState<number | null>(null);
  const [sugar, setSugar] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medsTaken, setMedsTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levelUp, setLevelUp] = useState<string | null>(null);

  const sugarN = parseInt(sugar);
  const sugarColor = !sugarN
    ? ""
    : sugarN < 100
      ? "text-green-400"
      : sugarN <= 125
        ? "text-amber-400"
        : "text-red-400";
  const sugarLabel = !sugarN
    ? ""
    : sugarN < 100
      ? "✓ NORMAL"
      : sugarN <= 125
        ? "⚠ PRE-DIABETIC RANGE"
        : "⚠ HIGH";

  const submit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const today = storage.getToday();
    today.sleepQuality = sleep;
    today.fastingSugar = sugarN || null;
    today.symptoms = symptoms;
    today.medsTaken = medsTaken;
    storage.saveDay(today);
    updateStreakOnCheckin();
    const res = grantXP(XP_REWARDS.morning_checkin);
    setLoading(false);
    toast.success("Check-in logged! Streak continues 🔥");
    if (res.leveledUp && res.newLevelTitle) {
      setLevelUp(res.newLevelTitle);
      setTimeout(() => navigate({ to: "/dashboard" }), 3000);
    } else {
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    }
    const game = storage.getGame();
    if (game.streak >= 7) unlockAchievement("week_warrior");
  };

  return (
    <AppShell>
      {loading && <HeartLoading />}
      {levelUp && <LevelUpOverlay title={levelUp} onDone={() => setLevelUp(null)} />}
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="font-display text-lg text-slate-100">MORNING CHECK-IN</h1>
        <p className="text-sm text-slate-400 mt-2">Takes 60 seconds. Earns 50 XP.</p>

        <div className="flex gap-2 my-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-amber-400" : "bg-slate-700"}`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
          {step === 0 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xs mb-6">HOW DID YOU SLEEP?</h2>
              <div className="grid grid-cols-5 gap-2">
                {["😴", "😐", "🙂", "😊", "😁"].map((e, i) => (
                  <button
                    key={i}
                    onClick={() => setSleep(i + 1)}
                    className={`rounded-xl border p-4 text-3xl transition-all ${sleep === i + 1 ? "border-blue-500 bg-blue-950" : "border-slate-600 bg-slate-900"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xs mb-6">FASTING SUGAR READING</h2>
              <div className="text-center">
                <input
                  type="number"
                  value={sugar}
                  onChange={(e) => setSugar(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-900 rounded-xl border border-slate-600 text-5xl text-center font-bold p-6 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="mt-3 text-slate-400 text-sm">mg/dL</p>
                {sugarLabel && (
                  <p className={`mt-3 font-display text-[10px] ${sugarColor}`}>{sugarLabel}</p>
                )}
                <button
                  onClick={() => {
                    setSugar("");
                    setStep(2);
                  }}
                  className="mt-4 text-xs text-slate-500 underline"
                >
                  Skip — I haven't tested yet
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xs mb-6">ANY SYMPTOMS OVERNIGHT?</h2>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((s) => {
                  const on = symptoms.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setSymptoms((p) =>
                          on
                            ? p.filter((x) => x !== s)
                            : s === "None"
                              ? ["None"]
                              : [...p.filter((x) => x !== "None"), s],
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${on ? "border-blue-500 bg-blue-600 text-white" : "border-slate-600 text-slate-300"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="font-display text-xs mb-6">MEDICATIONS TAKEN?</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 p-4">
                  <span className="text-sm text-slate-200">
                    {storage.getProfile()?.medications || "Your saved meds"}
                  </span>
                  <button
                    onClick={() => setMedsTaken((p) => !p)}
                    className={`h-7 w-12 rounded-full transition-all ${medsTaken ? "bg-green-500" : "bg-slate-600"}`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white transition-all ${medsTaken ? "ml-6" : "ml-1"}`}
                    />
                  </button>
                </div>
                <button
                  onClick={() => setMedsTaken(false)}
                  className="text-xs text-slate-500 underline"
                >
                  I haven't taken them yet
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="text-slate-400 text-sm">
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && sleep === null}
                className="rounded-full bg-blue-600 px-6 py-3 font-display text-[10px] text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
              >
                NEXT →
              </button>
            ) : (
              <button
                onClick={submit}
                className="rounded-full bg-amber-500 px-6 py-3 font-display text-[10px] text-slate-900 hover:scale-105 active:scale-95 transition-all"
              >
                SUBMIT CHECK-IN → +50 XP
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
