import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { HeartLoading } from "@/components/HeartLoading";
import { hydrateFromBackend, storage } from "@/lib/gameEngine";
import { rewardProfileComplete } from "@/lib/rewardEngine";
import { extractMedicationsFromImage } from "@/lib/grokApi";
import {
  ageLabelFromDob,
  formatAgeDisplay,
  isValidDob,
} from "@/lib/ageUtils";
import { buildProfileForSave, isProfileComplete } from "@/lib/profileUtils";
import type { UserProfile } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — GlycoBete" }] }),
  component: Onboarding,
});

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6 flex justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [medPreview, setMedPreview] = useState<string | null>(null);
  const [extractingMeds, setExtractingMeds] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateFromBackend()
      .then(() => {
        if (storage.getProfile()) navigate({ to: "/dashboard" });
        else setLoading(false);
      })
      .catch(() => navigate({ to: "/login" }));
  }, [navigate]);

  const select = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const onMedPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const [, base64] = dataUrl.split(",");
      setMedPreview(dataUrl);
      setExtractingMeds(true);
      try {
        const result = await extractMedicationsFromImage({
          image: {
            base64,
            mimeType: file.type as "image/jpeg" | "image/jpg" | "image/png",
          },
        });
        const text =
          result.extractedItems.length > 0
            ? result.extractedItems.join("\n")
            : result.medicationsText;
        select("medications", text);
        toast.success(
          result.source === "grok"
            ? "Medications extracted from photo"
            : "Photo processed — review and edit the text",
        );
      } catch {
        toast.error("Could not read medication photo. Type them manually.");
      } finally {
        setExtractingMeds(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const profileStepValid = () => {
    if (!profile.gender || !profile.diabetesType || !isValidDob(profile.dateOfBirth ?? "")) {
      return false;
    }
    if (profile.mode === "family") {
      return Boolean(profile.caregiverName?.trim() && profile.patientName?.trim());
    }
    return Boolean(profile.name?.trim());
  };

  const finish = () => {
    const saved = buildProfileForSave(profile);
    storage.setProfile(saved);
    rewardProfileComplete();
    navigate({ to: "/dashboard" });
  };

  if (loading) return <HeartLoading message="Preparing onboarding..." />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-800 p-6 shadow-2xl md:p-8">
        <Dots step={step} total={3} />

        {step === 0 && (
          <div className="animate-slide-up text-center">
            <h1 className="font-display text-lg text-slate-100">Who are you?</h1>
            <p className="mb-8 mt-3 text-sm text-slate-400">Choose the journey that fits you best.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <ModeCard
                emoji="🛡️"
                bg="bg-blue-500/10"
                ring="border-blue-500"
                selected={profile.mode === "patient"}
                onClick={() => select("mode", "patient")}
                title="I am battling diabetes"
                sub="Track your own glucose, meals, and progress"
              />
              <ModeCard
                emoji="💚"
                bg="bg-green-500/10"
                ring="border-green-500"
                selected={profile.mode === "family"}
                onClick={() => select("mode", "family")}
                title="Caring for someone"
                sub="Support a parent, spouse, or loved one"
              />
            </div>
            {profile.mode && (
              <button
                onClick={() => setStep(1)}
                className="mt-8 w-full rounded-full bg-amber-500 px-6 py-4 font-display text-[10px] text-slate-900 transition-all hover:scale-[1.02] active:scale-95"
              >
                CONTINUE →
              </button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up">
            <h1 className="text-center font-display text-lg text-slate-100">Your health profile</h1>
            <p className="mb-6 mt-3 text-center text-sm text-slate-400">
              {profile.mode === "family"
                ? "Tell us about you and the person you care for."
                : "A few details help GlycoBete personalize your plan."}
            </p>

            <div className="space-y-4">
              {profile.mode === "family" ? (
                <>
                  <Field label="YOUR NAME (CAREGIVER)">
                    <input
                      value={profile.caregiverName ?? ""}
                      onChange={(e) => select("caregiverName", e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="PATIENT'S NAME">
                    <input
                      value={profile.patientName ?? ""}
                      onChange={(e) => {
                        select("patientName", e.target.value);
                        select("name", e.target.value);
                      }}
                      placeholder="Name of person you care for"
                      className={inputClass}
                    />
                  </Field>
                </>
              ) : (
                <Field label="YOUR NAME">
                  <input
                    value={profile.name ?? ""}
                    onChange={(e) => select("name", e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="DATE OF BIRTH">
                <input
                  type="date"
                  value={profile.dateOfBirth ?? ""}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    select("dateOfBirth", e.target.value);
                    if (isValidDob(e.target.value)) {
                      select("age", formatAgeDisplay(e.target.value));
                    }
                  }}
                  className={inputClass}
                />
                {profile.dateOfBirth && isValidDob(profile.dateOfBirth) && (
                  <p className="mt-2 text-xs text-amber-400">
                    Age: {formatAgeDisplay(profile.dateOfBirth)} ({ageLabelFromDob(profile.dateOfBirth)})
                  </p>
                )}
              </Field>

              <Field label="GENDER">
                <Select
                  value={profile.gender}
                  onChange={(v) => select("gender", v)}
                  options={["Male", "Female", "Prefer not to say"]}
                />
              </Field>

              <Field label="DIABETES TYPE">
                <Select
                  value={profile.diabetesType}
                  onChange={(v) => select("diabetesType", v)}
                  options={["Type 1", "Type 2", "Pre-diabetic", "Not sure"]}
                />
              </Field>

              <Field label="CURRENT MEDICATIONS">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={extractingMeds}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-500 bg-slate-900 px-4 py-4 text-sm text-slate-300 transition-all hover:border-blue-500 hover:text-blue-300 disabled:opacity-50"
                  >
                    {extractingMeds ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Reading photo...
                      </>
                    ) : (
                      <>
                        <Camera size={18} /> Upload medication photo
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={onMedPhoto}
                  />
                  {medPreview && (
                    <img
                      src={medPreview}
                      alt="Medication preview"
                      className="mx-auto max-h-36 rounded-xl border border-slate-600 object-contain"
                    />
                  )}
                  <textarea
                    value={profile.medications ?? ""}
                    onChange={(e) => select("medications", e.target.value)}
                    placeholder="Type or edit medications — e.g. Metformin 500mg twice daily"
                    className={`${inputClass} min-h-28`}
                  />
                </div>
              </Field>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-400"
              >
                Back
              </button>
              <button
                disabled={!profileStepValid()}
                onClick={() => setStep(2)}
                className="flex-1 rounded-full bg-amber-500 px-6 py-4 font-display text-[10px] text-slate-900 transition-all hover:scale-[1.02] disabled:opacity-40"
              >
                CONTINUE →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up text-center">
            <h1 className="font-display text-lg text-slate-100">Choose your class</h1>
            <p className="mb-8 mt-3 text-sm text-slate-400">
              Just for fun — your health tracking works the same either way.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <ClassCard
                icon="🗡️"
                name="WARRIOR"
                color="red"
                selected={profile.class === "warrior"}
                onClick={() => select("class", "warrior")}
                quote="I log every meal. No excuses."
                perk="+10 XP on meal logs"
              />
              <ClassCard
                icon="🔮"
                name="MAGE"
                color="blue"
                selected={profile.class === "mage"}
                onClick={() => select("class", "mage")}
                quote="I track patterns and outsmart my sugar."
                perk="Earlier pattern insights"
              />
              <ClassCard
                icon="💚"
                name="HEALER"
                color="green"
                selected={profile.class === "healer"}
                onClick={() => select("class", "healer")}
                quote="I manage health for my whole family."
                perk="Extra family party slots"
              />
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-slate-600 px-5 py-3 text-sm text-slate-400"
              >
                Back
              </button>
              {profile.class && (
                <button
                  onClick={finish}
                  disabled={!isProfileComplete(profile)}
                  className="flex-1 rounded-full bg-amber-500 px-6 py-4 font-display text-[10px] text-slate-900 transition-all hover:scale-[1.02] disabled:opacity-40"
                >
                  START YOUR JOURNEY →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-600 bg-slate-900 p-4 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500";

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
      className={`rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-95 ${
        selected ? `${ring} ${bg}` : "border-slate-700 bg-slate-900"
      }`}
    >
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl ${bg}`}>
        {emoji}
      </div>
      <h3 className="mt-4 font-display text-[10px] text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{sub}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-display text-[9px] text-amber-400">{label}</label>
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
          type="button"
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
    red: "border-red-500 bg-red-950 shadow-[0_0_24px_rgba(239,68,68,0.35)]",
    blue: "border-blue-500 bg-blue-950 shadow-[0_0_24px_rgba(59,130,246,0.35)]",
    green: "border-green-500 bg-green-950 shadow-[0_0_24px_rgba(34,197,94,0.35)]",
  }[color];
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition-all hover:scale-[1.02] active:scale-95 ${
        selected ? sel : "border-slate-700 bg-slate-900"
      }`}
    >
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 font-display text-[9px] text-slate-100">{name}</h3>
      <p className="mt-2 text-xs italic text-slate-300">"{quote}"</p>
      <p className="mt-2 text-[11px] text-amber-400">{perk}</p>
    </button>
  );
}
