import type { GameState, DayLog, PartyMember } from "./types";

export const XP_REWARDS = {
  morning_checkin: 50,
  meal_log: 30,
  evening_summary: 40,
  prescription_upload: 40,
  streak_bonus_7day: 100,
  boss_defeated: 500,
  quest_completed: 100,
};

export const LEVELS = [
  { level: 1, xpRequired: 0, title: "ROOKIE" },
  { level: 2, xpRequired: 500, title: "TRACKER" },
  { level: 3, xpRequired: 1200, title: "WARRIOR" },
  { level: 4, xpRequired: 2500, title: "GUARDIAN" },
  { level: 5, xpRequired: 4500, title: "CHAMPION" },
  { level: 6, xpRequired: 7000, title: "LEGEND" },
];

export const DOCTOR_REPORT_COST = 100;

export function levelFromXP(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xpRequired) current = l;
  const next = LEVELS.find((l) => l.xpRequired > xp);
  const xpForCurrent = current.xpRequired;
  const xpForNext = next?.xpRequired ?? current.xpRequired + 3000;
  return { ...current, next, xpForCurrent, xpForNext };
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey() {
  return dateKey(new Date());
}

export function weekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return dateKey(d);
}

export function yesterdayKey() {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return dateKey(y);
}

export type XPGrantResult = {
  prevXP: number;
  newXP: number;
  leveledUp: boolean;
  newLevelTitle?: string;
};

export function bossProgressFromDays(days: Record<string, DayLog> | DayLog[]) {
  const start = dateFromKey(weekStart());
  let inRange = 0;
  const lookup = Array.isArray(days)
    ? Object.fromEntries(days.map((d) => [d.date, d]))
    : days;

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const dl = lookup[key];
    if (dl?.fastingSugar && dl.fastingSugar >= 70 && dl.fastingSugar <= 140) inRange++;
  }
  return { inRange, total: 7, defeated: inRange >= 5 };
}

export type Med = {
  name: string;
  whatItDoes: string;
  whyYouTakeIt: string;
  sideEffects: string;
  ifYouMissDose: string;
};

/** @deprecated Use api + SQLite backend. Kept for one-time localStorage migration reads. */
export const legacyStorage = {
  getParty: (): PartyMember[] => {
    if (typeof window === "undefined") return [];
    try {
      const v = localStorage.getItem("gb_party");
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  },
  getGame: (): GameState | null => {
    if (typeof window === "undefined") return null;
    try {
      const v = localStorage.getItem("gb_game");
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
};
