import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HeartLoading } from "@/components/HeartLoading";
import { clearStore } from "@/lib/gameEngine";
import { login } from "@/lib/healthApi";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — GlycoBete" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      clearStore();
      const user = await login(trimmed);
      toast.success(`Welcome back, ${trimmed}!`);
      navigate({ to: user.hasProfile ? "/dashboard" : "/onboarding", replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not log in. Start the backend with `npm run backend:dev`.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <HeartLoading message="Signing you in..." />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <h1 className="font-display text-lg text-center text-slate-100">GLYCOBETE</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your name to load your personal health data from the server.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div>
            <label className="font-display text-[9px] text-amber-400 mb-2 block">YOUR NAME</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Priya"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 p-4 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-full bg-amber-500 px-6 py-4 font-display text-xs text-slate-900 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            CONTINUE →
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          New name = new profile. Same name = your saved data.
        </p>
      </div>
    </div>
  );
}
