import type { DayLog, GameState, PartyMember, PrescriptionMed } from "./types";

const KEYS = {
  profile: "gb_profile",
  game: "gb_game",
  days: "gb_days",
  party: "gb_party",
  meds: "gb_prescription_meds",
  migrated: "gb_migrated_to_server",
};

function read<T>(k: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

/** One-time migration from localStorage to SQLite backend. */
export async function migrateLocalStorageIfNeeded(
  migrate: (payload: {
    profile: Omit<import("./types").UserProfile, "theme"> | null;
    game: GameState | null;
    days?: Record<string, DayLog>;
    party?: PartyMember[];
    meds?: PrescriptionMed[];
  }) => Promise<unknown>,
) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.migrated)) return;

  const profile = read<Omit<import("./types").UserProfile, "theme">>(KEYS.profile);
  const game = read<GameState>(KEYS.game);
  const days = read<Record<string, DayLog>>(KEYS.days) ?? undefined;
  const party = read<PartyMember[]>(KEYS.party) ?? undefined;
  const meds = read<PrescriptionMed[]>(KEYS.meds) ?? undefined;

  if (!profile && !game && !days && !party?.length && !meds?.length) {
    localStorage.setItem(KEYS.migrated, "1");
    return;
  }

  await migrate({ profile, game, days, party, meds });
  localStorage.setItem(KEYS.migrated, "1");
}

export function readLocalProfileExists(): boolean {
  return !!read(KEYS.profile);
}
