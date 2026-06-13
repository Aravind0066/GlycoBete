import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import { storage, unlockAchievement } from "@/lib/gameEngine";
import type { PartyMember } from "@/lib/types";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/party")({
  head: () => ({ meta: [{ title: "Party — GlycoBete" }] }),
  component: Party,
});

const RELATIONS = ["Papa", "Amma", "Spouse", "Son", "Daughter", "Other"];

function Party() {
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("Papa");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMembers(storage.getParty());
    setMounted(true);
  }, []);

  if (!mounted) return <HeartLoading message="Gathering your party..." />;
  const profile = storage.getProfile();
  const max = profile?.class === "healer" ? 4 : 2;
  const game = storage.getGame();

  const add = () => {
    if (!name.trim()) return;
    const next = [...members, { id: crypto.randomUUID(), name: name.trim(), relationship: rel }];
    storage.setParty(next);
    setMembers(next);
    unlockAchievement("party_leader");
    setName("");
    setOpen(false);
    toast.success("Member added to your party");
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <h1 className="font-display text-lg">YOUR PARTY</h1>
        <p className="text-sm text-slate-400 mt-2">Family members watching your streak.</p>

        <div className="my-6 space-y-3">
          {members.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center">
              <p className="font-display text-xs text-slate-300">YOUR PARTY IS EMPTY.</p>
              <p className="text-sm text-slate-400 mt-2">Invite someone who has your back.</p>
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-5 flex items-center gap-4"
              >
                <div className="h-14 w-14 rounded-full border-2 border-blue-500 bg-slate-900 flex items-center justify-center font-display text-xs">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[10px] truncate">{m.name}</p>
                  <p className="text-sm text-slate-400">{m.relationship}</p>
                  <p className="text-xs text-slate-400 mt-1">Watching your streak:</p>
                  <p className="font-display text-[10px] text-amber-400">{game.streak} DAYS 🔥</p>
                </div>
                <button
                  onClick={() => toast.success(`Boost sent to ${m.name}! 💪`)}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm text-white hover:scale-105 active:scale-95 transition-all"
                >
                  SEND BOOST 💪
                </button>
              </div>
            ))
          )}
        </div>

        {members.length < max && (
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-full bg-blue-600 px-6 py-4 font-display text-[10px] text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <UserPlus size={16} /> INVITE A MEMBER ({members.length}/{max})
          </button>
        )}
        <p className="mt-4 text-xs text-slate-500 text-center">
          No medical data shared. Streaks only.
        </p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/80 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h3 className="font-display text-xs mb-4">INVITE A MEMBER</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-xl border border-slate-600 bg-slate-900 p-3 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRel(r)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${rel === r ? "border-blue-500 bg-blue-600 text-white" : "border-slate-600 text-slate-300"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-slate-600 px-4 py-3 font-display text-[10px] text-white"
              >
                CANCEL
              </button>
              <button
                onClick={add}
                className="flex-1 rounded-full bg-amber-500 px-4 py-3 font-display text-[10px] text-slate-900"
              >
                ADD TO PARTY →
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
