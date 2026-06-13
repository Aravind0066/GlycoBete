import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageLoader } from "@/components/PageLoader";
import { api } from "@/lib/api";
import type { ChatMessage, DietRecommendation, UserProfile } from "@/lib/types";

export const Route = createFileRoute("/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — GlycoBete" }] }),
  component: AssistantPage,
});

const SUGGESTIONS = [
  "Can I eat mango?",
  "Why is my sugar increasing?",
  "Best breakfast for Type 2 diabetes?",
  "How much should I walk daily?",
];

function AssistantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [diet, setDiet] = useState<DietRecommendation | null>(null);
  const [recentGlucose, setRecentGlucose] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [p, dash] = await Promise.all([api.getProfile(), api.getHealthDashboard()]);
      setProfile(p);
      setRecentGlucose(dash.metrics.currentGlucose);
      setMessages([
        {
          role: "assistant",
          content: `Hi ${p?.name ?? "there"}! I'm GlycoBete AI — your diabetes companion. Ask me about food, glucose, exercise, or medications. Powered by Gemini.`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking || !profile) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    const reply = await api.chatAssistant({
      message: text.trim(),
      diabetesType: profile.diabetesType,
      name: profile.name,
      recentGlucose,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    setMessages((m) => [
      ...m,
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ]);
    setThinking(false);
  };

  const loadDiet = async () => {
    if (!profile) return;
    setThinking(true);
    const dash = await api.getHealthDashboard();
    const rec = await api.getDietRecommendations({
      name: profile.name,
      diabetesType: profile.diabetesType,
      age: profile.age,
      avgGlucose: dash.metrics.weeklyAverage,
    });
    setDiet(rec);
    setThinking(false);
  };

  return (
    <PageLoader loading={loading} message="Waking up AI assistant..." minMs={1400}>
      <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)]">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-cyan)]/20 border border-[var(--theme-cyan)]">
              <Bot size={20} className="text-[var(--theme-cyan)]" />
            </div>
            <div>
              <h1 className="font-display text-sm">AI HEALTH ASSISTANT</h1>
              <p className="text-xs text-[var(--theme-muted)] flex items-center gap-1">
                <Sparkles size={10} /> Powered by Gemini
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--theme-primary)] text-white rounded-br-sm"
                      : "glass-card bg-[var(--theme-card)]/80 text-[var(--theme-fg)] rounded-bl-sm border border-[var(--theme-border)]/50"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[var(--theme-muted)] text-sm"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-[var(--theme-cyan)]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  />
                ))}
              </div>
              Thinking...
            </motion.div>
          )}

          {diet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl border border-[var(--theme-accent)]/30 p-5"
            >
              <p className="font-display text-[10px] text-[var(--theme-accent)] mb-3 flex items-center gap-2">
                <Utensils size={12} /> TODAY'S DIET PLAN
              </p>
              {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                <div key={meal} className="mb-3">
                  <p className="text-xs text-[var(--theme-cyan)] capitalize">{meal}</p>
                  <p className="text-sm text-[var(--theme-fg)]">{diet[meal]}</p>
                </div>
              ))}
              <ul className="text-xs text-[var(--theme-muted)] space-y-1 mt-2">
                {diet.tips.map((t, i) => (
                  <li key={i}>💡 {t}</li>
                ))}
              </ul>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={thinking}
              className="rounded-full border border-[var(--theme-border)]/60 bg-[var(--theme-card)]/50 px-3 py-1.5 text-xs text-[var(--theme-muted)] hover:text-[var(--theme-accent)] hover:border-[var(--theme-accent)]/40 transition-colors"
            >
              {s}
            </button>
          ))}
          <button
            onClick={loadDiet}
            disabled={thinking}
            className="rounded-full border border-[var(--theme-accent)]/40 bg-[var(--theme-accent-soft)] px-3 py-1.5 text-xs text-[var(--theme-accent)]"
          >
            Get diet plan
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask about food, glucose, exercise..."
            className="flex-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] px-5 py-3 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-cyan)]/40"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => send(input)}
            disabled={thinking || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-cyan)] text-white disabled:opacity-40"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </PageLoader>
  );
}
