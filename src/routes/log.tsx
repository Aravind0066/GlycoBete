import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { storage } from "@/lib/gameEngine";
import { rewardMealLog, rewardPrescriptionUpload, unlockAchievementWithAlias } from "@/lib/rewardEngine";
import { analyzeMeal, readPrescription, type MealAnalysis } from "@/lib/geminiApi";
import type { PrescriptionMed } from "@/lib/types";
import { toast } from "sonner";
import { Camera, X } from "lucide-react";

export const Route = createFileRoute("/log")({
  head: () => ({ meta: [{ title: "Log Meal — GlycoBete" }] }),
  component: LogPage,
});

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function LogPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<string | null>(null);

  // prescription
  const [image, setImage] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [rxResult, setRxResult] = useState<{ meds: PrescriptionMed[]; notes: string } | null>(null);

  // meal
  const [meal, setMeal] = useState("");
  const [type, setType] = useState("Lunch");
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [result, setResult] = useState<MealAnalysis | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [, base64] = dataUrl.split(",");
      setImage({ data: base64, mime: f.type, preview: dataUrl });
    };
    reader.readAsDataURL(f);
  };

  const analyzeRx = async () => {
    if (!image) return;
    setLoading("Reading prescription...");
    try {
      const res = await readPrescription(image.data, image.mime);
      setRxResult({ meds: res.medications, notes: res.doctor_notes });
      const r = rewardPrescriptionUpload();
      if (r.leveledUp && r.newLevelTitle) setLevelUp(r.newLevelTitle);
      toast.success("+40 XP — Prescription decoded");
    } catch {
      toast.error("Couldn't read prescription");
    } finally {
      setLoading(null);
    }
  };

  const saveMeds = () => {
    if (!rxResult) return;
    storage.setMeds(rxResult.meds);
    toast.success("Saved to your profile");
  };

  const submitMeal = async () => {
    if (!meal.trim()) return;
    setLoading("Analyzing meal...");
    const profile = storage.getProfile();
    try {
      const res = await analyzeMeal(meal, profile?.diabetesType ?? "Type 2");
      setResult(res);
      const today = storage.getToday();
      today.meals.push({
        id: crypto.randomUUID(),
        time,
        description: meal,
        mealType: type,
        glycemicLevel: res.glycemic_level,
        explanation: res.explanation,
        indianInsight: res.indian_insight,
        xpEarned: res.xp_earned,
      });
      storage.saveDay(today);
      const r = rewardMealLog(profile?.class);
      if (/millet|ragi|jowar/i.test(res.indian_insight) && /millet|ragi|jowar/i.test(meal)) {
        unlockAchievementWithAlias("millet_convert");
      }
      if (r.leveledUp && r.newLevelTitle) setLevelUp(r.newLevelTitle);
      toast.success(`+${res.xp_earned} XP — meal logged`);
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(null);
    }
  };

  const flagBg = (l: string) =>
    l === "low" ? "bg-green-600" : l === "high" ? "bg-red-600" : "bg-amber-600";
  const flagText = (l: string) => (l === "low" ? "🟢 LOW" : l === "high" ? "🔴 HIGH" : "🟡 MEDIUM");

  return (
    <AppShell>
      {loading && <HeartLoading message={loading} />}
      {levelUp && <LevelUpOverlay title={levelUp} onDone={() => setLevelUp(null)} />}
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="font-display text-lg">LOG A MEAL</h1>
        <p className="text-sm text-slate-400 mt-2">Type what you ate in plain English.</p>

        {/* Prescription card */}
        <section className="mt-6 rounded-2xl border border-cyan-700 bg-slate-700 p-5">
          <p className="font-display text-[10px] text-cyan-400">📋 UPLOAD PRESCRIPTION</p>
          <p className="text-sm text-slate-400 mt-2">
            Upload your doctor's prescription — we'll extract your medications and explain each one
            in plain language.
          </p>

          {!image ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-4 w-full rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 p-8 text-center hover:border-cyan-500 transition-colors"
            >
              <Camera className="mx-auto text-slate-400" size={40} />
              <p className="mt-3 text-slate-400">Tap to upload or take photo</p>
            </button>
          ) : (
            <div className="mt-4 relative inline-block">
              <img src={image.preview} alt="prescription" className="max-h-48 rounded-xl" />
              <button
                onClick={() => {
                  setImage(null);
                  setRxResult(null);
                }}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onFile}
          />

          <button
            disabled={!image}
            onClick={analyzeRx}
            className="mt-4 w-full rounded-full bg-cyan-600 px-6 py-3 font-display text-[10px] text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
          >
            ANALYZE PRESCRIPTION → +40 XP
          </button>

          {rxResult && (
            <div className="mt-5 space-y-3 animate-slide-up">
              <p className="font-display text-[10px] text-cyan-400">PRESCRIPTION DECODED</p>
              {rxResult.meds.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-slate-800 border border-slate-600 p-4 space-y-2"
                >
                  <p className="font-display text-[10px]">{m.name}</p>
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">What it does:</span> {m.whatItDoes}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Why you take it:</span> {m.whyYouTakeIt}
                  </p>
                  <p className="text-sm text-amber-300">
                    <span className="text-slate-500">Watch for:</span> {m.sideEffects}
                  </p>
                  <p className="text-sm text-slate-400">
                    <span className="text-slate-500">If you miss a dose:</span> {m.ifYouMissDose}
                  </p>
                </div>
              ))}
              {rxResult.notes && (
                <p className="text-xs text-slate-400 italic">📝 {rxResult.notes}</p>
              )}
              <button
                onClick={saveMeds}
                className="w-full rounded-full bg-green-600 px-6 py-3 font-display text-[10px] text-white"
              >
                SAVE TO PROFILE
              </button>
            </div>
          )}
        </section>

        <div className="my-6 flex items-center gap-3 text-slate-500 text-sm">
          <div className="h-px flex-1 bg-slate-700" /> OR LOG A MEAL{" "}
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        {/* Meal input */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
          <div className="relative">
            <textarea
              value={meal}
              onChange={(e) => setMeal(e.target.value.slice(0, 500))}
              placeholder="e.g. ate two rotis with dal tadka and a small bowl of curd for lunch"
              className="w-full min-h-36 rounded-xl border border-slate-600 bg-slate-900 p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="absolute bottom-3 right-3 text-xs text-slate-500">
              {meal.length} / 500
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {MEAL_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${type === t ? "border-blue-500 bg-blue-600 text-white" : "border-slate-600 text-slate-300"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="font-display text-[8px] text-slate-400">TIME</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 rounded-xl bg-slate-900 border border-slate-600 px-3 py-2 text-slate-100"
            />
          </div>

          <button
            disabled={!meal.trim()}
            onClick={submitMeal}
            className="mt-5 w-full rounded-full bg-amber-500 px-6 py-3 font-display text-[10px] text-slate-900 font-bold hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40"
          >
            ANALYZE MEAL → +30 XP
          </button>
        </section>

        {result && (
          <section className="mt-5 rounded-2xl bg-slate-700 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="font-display text-xs">{result.meal_name}</h3>
              <span
                className={`rounded-full px-3 py-1 font-display text-[10px] text-white ${flagBg(result.glycemic_level)}`}
              >
                {flagText(result.glycemic_level)}
              </span>
            </div>
            <p className="text-sm text-slate-300">{result.explanation}</p>
            <p className="mt-3 text-sm text-cyan-300">💡 {result.indian_insight}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setMeal("");
                }}
                className="flex-1 rounded-full bg-blue-600 px-4 py-3 font-display text-[10px] text-white"
              >
                LOG ANOTHER
              </button>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="flex-1 rounded-full bg-slate-600 px-4 py-3 font-display text-[10px] text-white"
              >
                BACK TO DASHBOARD
              </button>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
