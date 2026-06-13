import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  Heart,
} from "lucide-react";

import { ThemeToggleFab } from "@/components/ThemeToggle";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [{ title: "GlycoBete — Smart Diabetes Companion" }],
  }),
  component: WelcomePage,
});

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Glucose Intelligence",
    desc: "Track fasting sugar, see trends, and get HbA1c estimates with color-coded danger zones.",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    desc: "Ask Gemini-powered questions about food, exercise, and glucose — in plain English.",
  },
  {
    icon: Activity,
    title: "Health Score",
    desc: "Get a 0–100 score based on glucose consistency, meds, sleep, and meal logging.",
  },
  {
    icon: Shield,
    title: "Risk Prediction",
    desc: "Hypo and hyperglycemia risk alerts based on your recent readings and habits.",
  },
  {
    icon: Users,
    title: "Family Mode",
    desc: "Caretakers can monitor elderly patients and children with party tracking.",
  },
  {
    icon: Zap,
    title: "Gamified Journey",
    desc: "Earn XP, defeat the Sugar Spike boss, unlock achievements, and stay motivated.",
  },
];

const STATS = [
  { n: "70–140", l: "Target mg/dL" },
  { n: "Gemini", l: "AI Engine" },
  { n: "4", l: "Themes" },
  { n: "100", l: "Health Score" },
];

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] overflow-x-hidden">
      <ThemeToggleFab />

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28 max-w-6xl mx-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-[var(--theme-primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[var(--theme-cyan)]/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-cyan)]/30 bg-[var(--theme-cyan)]/10 px-4 py-1.5 mb-6"
          >
            <Heart size={14} className="text-[var(--theme-cyan)]" />
            <span className="text-xs text-[var(--theme-cyan)]">India's Smart Diabetes Companion</span>
          </motion.div>

          <h1 className="font-display text-2xl md:text-4xl leading-relaxed text-[var(--theme-fg)]">
            GLYCO<span className="text-[var(--theme-accent)]">BETE</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[var(--theme-muted)] max-w-2xl mx-auto leading-relaxed">
            Predict, analyze, educate, and assist — not just log numbers.
            Your AI-powered diabetes RPG starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link to="/onboarding">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-primary)] px-8 py-4 font-display text-xs text-white shadow-lg shadow-[var(--theme-primary)]/25"
              >
                START YOUR QUEST <ChevronRight size={16} />
              </motion.span>
            </Link>
            <Link to="/dashboard">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--theme-border)] px-8 py-4 font-display text-xs text-[var(--theme-fg)]"
              >
                OPEN DASHBOARD
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 border-y border-[var(--theme-border)]/50 bg-[var(--theme-card)]/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-xl md:text-2xl text-[var(--theme-accent)]">{s.n}</p>
              <p className="text-xs text-[var(--theme-muted)] mt-2">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-center text-sm mb-12"
        >
          BUILT FOR REAL DIABETES MANAGEMENT
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl border border-[var(--theme-border)]/50 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-accent-soft)] mb-4">
                <f.icon size={20} className="text-[var(--theme-accent)]" />
              </div>
              <h3 className="font-display text-[10px] text-[var(--theme-fg)]">{f.title}</h3>
              <p className="text-sm text-[var(--theme-muted)] mt-3 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Demo */}
      <section className="px-4 py-16 max-w-3xl mx-auto">
        <div className="glass-card rounded-2xl border border-[var(--theme-cyan)]/30 p-6 md:p-8">
          <p className="font-display text-[10px] text-[var(--theme-cyan)] mb-4">🤖 AI ASSISTANT DEMO</p>
          <div className="space-y-3">
            <div className="rounded-2xl bg-[var(--theme-primary)]/80 px-4 py-3 text-sm text-white ml-8">
              Can I eat 2 idlis for breakfast?
            </div>
            <div className="rounded-2xl glass-card px-4 py-3 text-sm text-[var(--theme-fg)] mr-8 border border-[var(--theme-border)]/40">
              2 idlis with sambar is a solid low-GI choice! The fermentation lowers glycemic impact.
              Pair with a protein like curd. Estimated carb impact: moderate. +30 XP for logging! 🎯
            </div>
          </div>
          <Link to="/assistant" className="block mt-6 text-center">
            <span className="font-display text-[10px] text-[var(--theme-cyan)] hover:underline">
              TRY THE FULL AI ASSISTANT →
            </span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-sm">READY TO LEVEL UP YOUR HEALTH?</h2>
          <p className="text-[var(--theme-muted)] mt-3 text-sm">
            Free to use. Powered by Gemini AI. Built for Indian patients.
          </p>
          <Link to="/onboarding" className="inline-block mt-8">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="rounded-full bg-[var(--theme-accent)] px-10 py-4 font-display text-xs text-slate-900 shadow-lg"
            >
              BEGIN ONBOARDING
            </motion.span>
          </Link>
        </motion.div>
      </section>

      <footer className="px-4 py-8 border-t border-[var(--theme-border)]/50 text-center text-xs text-[var(--theme-muted)]">
        GlycoBete is not a substitute for professional medical advice. Always consult your doctor.
      </footer>
    </div>
  );
}
