import type { GameState, DayLog, UserProfile, PartyMember } from "./types";

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

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey() {
  return dateKey(new Date());
}

export function weekStart() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return dateKey(d);
}

const KEYS = {
  profile: "gb_profile",
  game: "gb_game",
  days: "gb_days",
  party: "gb_party",
  meds: "gb_prescription_meds",
};

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

type Med = {
  name: string;
  whatItDoes: string;
  whyYouTakeIt: string;
  sideEffects: string;
  ifYouMissDose: string;
};

export const storage = {
  getProfile: (): UserProfile | null => read<UserProfile | null>(KEYS.profile, null),
  setProfile: (p: UserProfile) => write(KEYS.profile, p),

  getGame: (): GameState => {
    const existing = read<GameState | null>(KEYS.game, null);
    if (existing) return existing;
    const init: GameState = {
      totalXP: 0,
      level: 1,
      levelTitle: "ROOKIE",
      streak: 0,
      lastCheckinDate: "",
      healthCoins: 0,
      achievements: [],
      bossDefeated: false,
      bossWeekStart: weekStart(),
      activeQuest: null,
    };
    write(KEYS.game, init);
    return init;
  },
  setGame: (g: GameState) => write(KEYS.game, g),

  getDays: (): Record<string, DayLog> => read(KEYS.days, {}),
  getToday: (): DayLog => {
    const days = storage.getDays();
    const key = todayKey();
    if (!days[key]) {
      days[key] = {
        date: key,
        fastingSugar: null,
        sleepQuality: null,
        symptoms: [],
        medsTaken: false,
        meals: [],
        eveningSummary: null,
      };
      write(KEYS.days, days);
    }
    return days[key];
  },
  saveDay: (d: DayLog) => {
    const days = storage.getDays();
    days[d.date] = d;
    write(KEYS.days, days);
  },

  getParty: (): PartyMember[] => read(KEYS.party, []),
  setParty: (p: PartyMember[]) => write(KEYS.party, p),

  getMeds: (): Med[] => read<Med[]>(KEYS.meds, []),
  setMeds: (m: Med[]) => write(KEYS.meds, m),
};

export type XPGrantResult = {
  prevXP: number;
  newXP: number;
  leveledUp: boolean;
  newLevelTitle?: string;
};

export function grantXP(amount: number, classType?: string): XPGrantResult {
  const game = storage.getGame();
  const prevXP = game.totalXP;
  const bonus = classType === "warrior" && amount === XP_REWARDS.meal_log ? 10 : 0;
  const total = amount + bonus;
  game.totalXP += total;
  game.healthCoins += Math.floor(total / 10);
  const before = levelFromXP(prevXP);
  const after = levelFromXP(game.totalXP);
  const leveledUp = after.level > before.level;
  game.level = after.level;
  game.levelTitle = after.title;
  storage.setGame(game);
  return {
    prevXP,
    newXP: game.totalXP,
    leveledUp,
    newLevelTitle: leveledUp ? after.title : undefined,
  };
}

export function unlockAchievement(id: string) {
  const game = storage.getGame();
  if (!game.achievements.includes(id)) {
    game.achievements.push(id);
    storage.setGame(game);
    return true;
  }
  return false;
}

export function updateStreakOnCheckin() {
  const game = storage.getGame();
  const today = todayKey();
  if (game.lastCheckinDate === today) return game.streak;
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yKey = dateKey(yest);
  if (game.lastCheckinDate === yKey) game.streak += 1;
  else game.streak = 1;
  game.lastCheckinDate = today;
  storage.setGame(game);
  return game.streak;
}

export function checkBossWeek() {
  const game = storage.getGame();
  const ws = weekStart();
  if (game.bossWeekStart !== ws) {
    game.bossWeekStart = ws;
    game.bossDefeated = false;
    storage.setGame(game);
  }
}

export function bossProgress() {
  // count days this week with fasting 70-140
  checkBossWeek();
  const days = storage.getDays();
  const start = dateFromKey(weekStart());
  let inRange = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const dl = days[key];
    if (dl?.fastingSugar && dl.fastingSugar >= 70 && dl.fastingSugar <= 140) inRange++;
  }
  return { inRange, total: 7, defeated: inRange >= 5 };
}

export function last7Days(): DayLog[] {
  const days = storage.getDays();
  const out: DayLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push(
      days[key] ?? {
        date: key,
        fastingSugar: null,
        sleepQuality: null,
        symptoms: [],
        medsTaken: false,
        meals: [],
        eveningSummary: null,
      },
    );
  }
  return out;
}
