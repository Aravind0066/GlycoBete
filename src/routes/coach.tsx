import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Send, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { askGlycoBeteCoach, type CoachResponse } from "@/lib/grokApi";
import { storage, hydrateFromBackend } from "@/lib/gameEngine";
import { rewardCoachChat } from "@/lib/rewardEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/coach")({
  head: () => ({ meta: [{ title: "AI Coach - GlycoBete" }] }),
  component: CoachPage,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  source?: CoachResponse["source"];
};

const STARTER_PROMPTS = [
  "Can I eat poha for breakfast?",
  "What does 165 mg/dL after lunch mean?",
  "Give me a simple walking plan.",
];

function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I am your GlycoBete coach. Ask me about food, exercise, diabetes basics, or glucose readings.",
      suggestions: ["Log a glucose reading", "Ask about a meal", "Plan a short walk"],
      source: "fallback",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(storage.getProfile());

  useEffect(() => {
    hydrateFromBackend().then(() => setProfile(storage.getProfile()));
  }, []);

  const ask = async (text = input) => {
    const question = text.trim();
    if (!question || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await askGlycoBeteCoach({
        message: question,
        history: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        profile: profile ? { ...profile } : undefined,
      });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${response.reply}\n\n${response.safetyDisclaimer}`,
          suggestions: response.suggestedActions,
          source: response.source,
        },
      ]);
      rewardCoachChat();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI coach unavailable");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I could not reach the GlycoBete AI service. Run `npm run backend:dev` in a second terminal, then refresh.",
          suggestions: ["Start backend", "Check API key", "Try again"],
          source: "fallback",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col p-4 md:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-lg">AI COACH</h1>
            <p className="mt-2 text-sm text-slate-400">
              Food, exercise, glucose education, and daily diabetes guidance.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-600 bg-blue-950 text-blue-300">
            <Bot size={24} />
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-amber-700 bg-amber-950/70 p-4">
          <div className="flex gap-3">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-sm text-amber-100">
              GlycoBete is educational support, not a doctor. For severe symptoms or dangerous
              glucose readings, seek urgent medical care.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[88%] rounded-2xl p-4 ${
                message.role === "user"
                  ? "ml-auto bg-blue-600 text-white"
                  : "mr-auto border border-slate-700 bg-slate-900 text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              {message.source && (
                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                  Source: {message.source}
                </p>
              )}
              {message.suggestions?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => (
                    <span
                      key={suggestion}
                      className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading && (
            <div className="mr-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
              GlycoBete is thinking...
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => ask(prompt)}
              className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-300 transition-all hover:border-blue-500 hover:text-blue-300"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about a meal, workout, or glucose reading..."
            className="min-h-12 flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            disabled={loading || !input.trim()}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 transition-all hover:scale-105 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
