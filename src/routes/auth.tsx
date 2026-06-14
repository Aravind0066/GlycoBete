import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import {
  getAuthSession,
  isGoogleAuthAvailable,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/authService";
import { storage } from "@/lib/gameEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — GlycoBete" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const googleEnabled = isGoogleAuthAvailable();

  useEffect(() => {
    const session = getAuthSession();
    if (session) {
      navigate({ to: storage.getProfile() ? "/dashboard" : "/onboarding", replace: true });
    }
  }, [navigate]);

  const afterAuth = () => {
    navigate({ to: storage.getProfile() ? "/dashboard" : "/onboarding", replace: true });
  };

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        toast.success("Account created. Welcome to GlycoBete!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Welcome back!");
      }
      afterAuth();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800 p-8 shadow-2xl">
        <div className="text-center">
          <p className="font-display text-[10px] text-amber-400">GLYCOBETE</p>
          <h1 className="mt-3 font-display text-lg text-slate-100">
            {mode === "signup" ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {mode === "signup"
              ? "Sign up once to save your progress across visits."
              : "Sign in to continue your diabetes journey."}
          </p>
        </div>

        {googleEnabled && (
          <button
            type="button"
            disabled={loading}
            onClick={googleSignIn}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100 transition-all hover:border-blue-500 hover:bg-slate-950 disabled:opacity-50"
          >
            <span className="text-lg">G</span>
            Continue with Google (Gmail)
          </button>
        )}

        {googleEnabled && (
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">or use email</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>
        )}

        <form onSubmit={submitEmail} className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-display text-[9px] text-amber-400">EMAIL</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-600 bg-slate-900 px-4">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                required
                className="min-h-12 w-full bg-transparent text-slate-100 outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block font-display text-[9px] text-amber-400">PASSWORD</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-600 bg-slate-900 px-4">
              <Lock size={18} className="text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                required
                minLength={mode === "signup" ? 6 : 1}
                className="min-h-12 w-full bg-transparent text-slate-100 outline-none"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-4 font-display text-[10px] text-slate-900 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {mode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />}
            {mode === "signup" ? "SIGN UP" : "SIGN IN"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === "signup" ? "Already have an account?" : "First time here?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-amber-400 underline-offset-4 hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>

        {!googleEnabled && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Local demo mode: accounts are saved on this device. Add Supabase keys for Google sign-in
            and cloud sync.
          </p>
        )}
      </div>
    </div>
  );
}
