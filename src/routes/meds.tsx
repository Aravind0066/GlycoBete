import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Pill, Clock, Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AnimatedCard } from "@/components/AnimatedCard";
import { PageLoader } from "@/components/PageLoader";
import { api } from "@/lib/api";
import type { DayLog, PrescriptionMed } from "@/lib/types";

export const Route = createFileRoute("/meds")({
  head: () => ({ meta: [{ title: "Medications — GlycoBete" }] }),
  component: MedsPage,
});

function MedsPage() {
  const [loading, setLoading] = useState(true);
  const [meds, setMeds] = useState<PrescriptionMed[]>([]);
  const [today, setToday] = useState<DayLog | null>(null);
  const [profileMeds, setProfileMeds] = useState("");

  useEffect(() => {
    (async () => {
      const [m, t, p] = await Promise.all([api.getMeds(), api.getToday(), api.getProfile()]);
      setMeds(m);
      setToday(t);
      setProfileMeds(p?.medications ?? "");
      setLoading(false);
    })();
  }, []);

  const toggleMeds = async () => {
    if (!today) return;
    today.medsTaken = !today.medsTaken;
    await api.saveDay(today);
    setToday({ ...today });
  };

  const hours = new Date().getHours();
  const doses = [
    { time: "Morning (8 AM)", taken: today?.medsTaken && hours >= 8, upcoming: hours < 8 },
    { time: "Evening (8 PM)", taken: false, upcoming: hours < 20 },
  ];

  return (
    <PageLoader loading={loading} message="Loading medications..." minMs={1400}>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-lg">MEDICATION TRACKER</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-2">
            Your schedule, doses, and prescription details.
          </p>
        </motion.div>

        <AnimatedCard delay={0.1}>
          <div className="glass-card rounded-2xl border border-[var(--theme-border)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-[10px] text-[var(--theme-muted)]">TODAY'S STATUS</p>
                <p className="text-lg text-[var(--theme-fg)] mt-1">
                  {today?.medsTaken ? "✅ Medication taken" : "⏳ Not logged yet"}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMeds}
                className={`rounded-full px-5 py-2.5 font-display text-[10px] ${
                  today?.medsTaken
                    ? "bg-green-900/50 border border-green-500 text-green-300"
                    : "bg-[var(--theme-primary)] text-white"
                }`}
              >
                {today?.medsTaken ? "TAKEN ✓" : "MARK TAKEN"}
              </motion.button>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.15}>
          <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5">
            <p className="font-display text-[10px] text-[var(--theme-cyan)] mb-4 flex items-center gap-2">
              <Clock size={12} /> DOSE TIMELINE
            </p>
            <div className="space-y-0">
              {doses.map((d, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        d.taken
                          ? "bg-green-500/20 border border-green-500"
                          : d.upcoming
                            ? "bg-[var(--theme-card-alt)] border border-[var(--theme-border)]"
                            : "bg-red-500/20 border border-red-500"
                      }`}
                    >
                      {d.taken ? (
                        <Check size={14} className="text-green-400" />
                      ) : d.upcoming ? (
                        <Clock size={14} className="text-[var(--theme-muted)]" />
                      ) : (
                        <AlertCircle size={14} className="text-red-400" />
                      )}
                    </div>
                    {i < doses.length - 1 && (
                      <div className="w-0.5 h-8 bg-[var(--theme-border)]" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm text-[var(--theme-fg)]">{d.time}</p>
                    <p className="text-xs text-[var(--theme-muted)]">
                      {d.taken ? "Completed" : d.upcoming ? "Upcoming" : "Missed — take now if safe"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>

        {profileMeds && (
          <AnimatedCard delay={0.2}>
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5">
              <p className="font-display text-[10px] text-[var(--theme-muted)] mb-2">PROFILE MEDS</p>
              <p className="text-sm text-[var(--theme-fg)]">{profileMeds}</p>
            </div>
          </AnimatedCard>
        )}

        {meds.length > 0 ? (
          meds.map((med, i) => (
            <AnimatedCard key={i} delay={0.25 + i * 0.05}>
              <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-primary)]/20">
                    <Pill size={18} className="text-[var(--theme-primary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-[10px] text-[var(--theme-accent)]">{med.name}</p>
                    <p className="text-sm text-[var(--theme-fg)] mt-2">{med.whatItDoes}</p>
                    <p className="text-xs text-[var(--theme-muted)] mt-2">{med.whyYouTakeIt}</p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <span className="text-amber-400">⚠ {med.sideEffects}</span>
                      <span className="text-[var(--theme-cyan)]">💊 {med.ifYouMissDose}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          ))
        ) : (
          <AnimatedCard delay={0.25}>
            <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-8 text-center">
              <Pill size={32} className="mx-auto text-[var(--theme-muted)] mb-3" />
              <p className="text-sm text-[var(--theme-muted)]">
                No prescription meds saved yet.
              </p>
              <p className="text-xs text-[var(--theme-muted)] mt-2">
                Upload a prescription photo from the Log page to auto-extract medications.
              </p>
            </div>
          </AnimatedCard>
        )}
      </div>
    </PageLoader>
  );
}
