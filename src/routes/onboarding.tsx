import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { storage } from "@/lib/gameEngine";
import type { UserProfile } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — GlycoBete" }] }),
  component: Onboarding,
});

function Dots({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i <= step ? "bg-amber-400" : "bg-slate-700"}`}
        />
      ))}
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  const isFamily = profile.mode === "family";

  const select = (k: keyof UserProfile, v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const finish = () => {
    storage.setProfile(profile as UserProfile);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Dots step={step} />

        {step === 0 && (
          <div className="animate-slide-up">
            <h1 className="font-display text-xl text-center text-slate-100 mb-2">WHO ARE YOU?</h1>
            <p className="text-center text-slate-400 mb-8">Pick your journey</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <ModeCard
                emoji="🧑"
                bg="bg-blue-500/10"
                ring="border-blue-500"
                selected={profile.mode === "patient"}
                onClick={() => select("mode", "patient")}
                title="I HAVE DIABETES"
                sub="Track your own health"
              />
              <ModeCard
                emoji="👨‍👩‍👧"
                bg="bg-green-500/10"
                ring="border-green-500"
                selected={profile.mode === "family"}
                onClick={() => select("mode", "family")}
                title="I CARE FOR SOMEONE"
                sub="Manage family member's health"
              />
            </div>
            {profile.mode && (
              <button
                onClick={() => setStep(1)}
                className="mt-8 w-full rounded-full bg-amber-500 px-6 py-4 font-display text-xs text-slate-900 hover:scale-105 active:scale-95 transition-all"
              >
                NEXT →
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up">
            <h1 className="font-display text-xl text-center text-slate-100 mb-2">
              {isFamily ? "PATIENT DETAILS" : "BUILD YOUR CHARACTER"}
            </h1>
            <div className="h-2 w-full rounded-full bg-slate-700 mb-8 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: "66%" }} />
            </div>
            <div className="space-y-4">
              <Field label={isFamily ? "PATIENT NAME" : "NAME"}>
                <input
                  value={profile.name ?? ""}
                  onChange={(e) => select("name", e.target.value)}
                  placeholder={isFamily ? "Patient's name" : "Your name"}
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </Field>
              <Field label={isFamily ? "PATIENT AGE" : "AGE"}>
                <Select
                  value={profile.age}
                  onChange={(v) => select("age", v)}
                  options={["Under 18", "18–40", "41–60", "60+"]}
                />
              </Field>
              <Field label={isFamily ? "PATIENT GENDER" : "GENDER"}>
                <Select
                  value={profile.gender}
                  onChange={(v) => select("gender", v)}
                  options={["Male", "Female", "Prefer not to say"]}
                />
              </Field>
              <Field label={isFamily ? "PATIENT DIABETES TYPE" : "DIABETES TYPE"}>
                <Select
                  value={profile.diabetesType}
                  onChange={(v) => select("diabetesType", v)}
                  options={["Type 1", "Type 2", "Pre-diabetic", "Not sure"]}
                />
              </Field>
              <Field label={isFamily ? "PATIENT CURRENT MEDICATIONS" : "CURRENT MEDICATIONS"}>
                <textarea
                  value={profile.medications ?? ""}
                  onChange={(e) => select("medications", e.target.value)}
                  placeholder="e.g. Metformin 500mg twice daily, Glimepiride 1mg"
                  className="w-full min-h-28 rounded-xl border border-slate-600 bg-slate-900 p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </Field>
            </div>
            <button
              disabled={!profile.name || !profile.age || !profile.gender || !profile.diabetesType}
              onClick={() => setStep(2)}
              className="mt-8 w-full rounded-full bg-amber-500 px-6 py-4 font-display text-xs text-slate-900 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100"
            >
              NEXT →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h1 className="font-display text-xl text-center text-slate-100 mb-2">
              CHOOSE YOUR CLASS
            </h1>
            <p className="text-center text-slate-400 mb-8 text-sm">
              This is just for fun — your health data is the same either way.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <ClassCard
                icon="🗡️"
                name="WARRIOR"
                color="red"
                selected={profile.class === "warrior"}
                onClick={() => select("class", "warrior")}
                quote="I log every meal. No excuses."
                perk="+10 XP bonus on every meal log"
              />
              <ClassCard
                icon="🔮"
                name="MAGE"
                color="blue"
                selected={profile.class === "mage"}
                onClick={() => select("class", "mage")}
                quote="I track patterns and outsmart my sugar."
                perk="Unlock advanced pattern detection earlier"
              />
              <ClassCard
                icon="💚"
                name="HEALER"
                color="green"
                selected={profile.class === "healer"}
                onClick={() => select("class", "healer")}
                quote="I manage health for my whole family."
                perk="Family party slots: 4 instead of 2"
              />
            </div>
            {profile.class && (
              <button
                onClick={finish}
                className="mt-8 w-full rounded-full bg-amber-500 px-6 py-4 font-display text-xs text-slate-900 hover:scale-105 active:scale-95 transition-all"
              >
                START YOUR JOURNEY →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeCard({
  emoji,
  bg,
  ring,
  selected,
  onClick,
  title,
  sub,
}: {
  emoji: string;
  bg: string;
  ring: string;
  selected: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 ${selected ? ring : "border-slate-700"} ${selected ? bg : "bg-slate-800"} p-6 text-left hover:scale-[1.02] active:scale-95 transition-all`}
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl ${bg}`}>
        {emoji}
      </div>
      <h3 className="mt-4 font-display text-xs text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{sub}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-display text-[9px] text-amber-400 mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-4 py-2 text-sm transition-all ${
            value === o
              ? "border-blue-500 bg-blue-600 text-white"
              : "border-slate-600 text-slate-300 hover:border-slate-500"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function ClassCard({
  icon,
  name,
  color,
  selected,
  onClick,
  quote,
  perk,
}: {
  icon: string;
  name: string;
  color: "red" | "blue" | "green";
  selected: boolean;
  onClick: () => void;
  quote: string;
  perk: string;
}) {
  const sel = {
    red: "border-red-500 bg-red-950 shadow-[0_0_24px_rgba(239,68,68,0.4)]",
    blue: "border-blue-500 bg-blue-950 shadow-[0_0_24px_rgba(59,130,246,0.4)]",
    green: "border-green-500 bg-green-950 shadow-[0_0_24px_rgba(34,197,94,0.4)]",
  }[color];
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-95 ${selected ? sel : "border-slate-700 bg-slate-800"}`}
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 font-display text-xs text-slate-100">{name}</h3>
      <p className="mt-3 text-sm italic text-slate-300">"{quote}"</p>
      <p className="mt-3 text-xs text-amber-400">{perk}</p>
    </button>
  );
}
