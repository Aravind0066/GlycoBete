import type { QuestRecord } from "./types";
import {
  bossProgress,
  grantXP,
  storage,
  todayKey,
  type XPGrantResult,
  weekStart,
} from "./gameEngine";

const QUESTS_KEY = "gb_quests";

export type QuestAction =
  | "log_glucose"
  | "log_meal"
  | "confirm_meds"
  | "complete_profile"
  | "coach_chat"
  | "evening_summary"
  | "days_in_range";

export type QuestProgressView = {
  completed: number;
  total: number;
  percent: number;
  items: { id: string; label: string; done: boolean; xp: number; questType: "daily" | "weekly" }[];
  activeDailyQuest: string | null;
};

function readQuests(): QuestRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUESTS_KEY);
    return raw ? (JSON.parse(raw) as QuestRecord[]) : [];
  } catch {
    return [];
  }
}

function writeQuests(quests: QuestRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
  import("./healthApi").then(({ saveQuests }) => saveQuests(quests).catch(console.error));
}

function dailyTemplates(): Omit<QuestRecord, "progressCount" | "completedAt">[] {
  const today = todayKey();
  return [
    {
      id: `daily-glucose-${today}`,
      title: "Log fasting glucose",
      description: "Record your morning glucose reading.",
      questType: "daily",
      action: "log_glucose",
      targetCount: 1,
      xpReward: 10,
      dueDate: today,
    },
    {
      id: `daily-meal-${today}`,
      title: "Log one meal",
      description: "Track what you ate today.",
      questType: "daily",
      action: "log_meal",
      targetCount: 1,
      xpReward: 10,
      dueDate: today,
    },
    {
      id: `daily-meds-${today}`,
      title: "Confirm medication",
      description: "Mark whether you took your meds.",
      questType: "daily",
      action: "confirm_meds",
      targetCount: 1,
      xpReward: 10,
      dueDate: today,
    },
  ];
}

function weeklyTemplate(): Omit<QuestRecord, "progressCount" | "completedAt"> {
  const ws = weekStart();
  return {
    id: `weekly-boss-${ws}`,
    title: "Weekly range challenge",
    description: "Keep fasting glucose in range on 5 of 7 days.",
    questType: "weekly",
    action: "days_in_range",
    targetCount: 5,
    xpReward: 100,
    dueDate: ws,
  };
}

export function ensureQuests() {
  const today = todayKey();
  const ws = weekStart();
  let quests = readQuests().filter(
    (quest) =>
      (quest.questType === "daily" && quest.dueDate === today) ||
      (quest.questType === "weekly" && quest.dueDate === ws),
  );

  for (const template of dailyTemplates()) {
    if (!quests.some((quest) => quest.id === template.id)) {
      quests.push({ ...template, progressCount: 0, completedAt: null });
    }
  }

  const weekly = weeklyTemplate();
  if (!quests.some((quest) => quest.id === weekly.id)) {
    quests.push({ ...weekly, progressCount: 0, completedAt: null });
  }

  writeQuests(quests);
  return quests;
}

function completeQuest(quest: QuestRecord): XPGrantResult | null {
  if (quest.completedAt) return null;
  quest.completedAt = new Date().toISOString();
  return grantXP(quest.xpReward);
}

export function syncWeeklyBossQuest() {
  ensureQuests();
  const quests = readQuests();
  const weekly = quests.find((quest) => quest.action === "days_in_range" && !quest.completedAt);
  if (!weekly) return null;

  const boss = bossProgress();
  weekly.progressCount = Math.min(weekly.targetCount, boss.inRange);
  let levelUp: XPGrantResult | null = null;
  if (weekly.progressCount >= weekly.targetCount) {
    levelUp = completeQuest(weekly);
  }
  writeQuests(quests);
  return levelUp;
}

export function recordQuestAction(action: QuestAction, amount = 1) {
  ensureQuests();
  const quests = readQuests();
  let levelUp: XPGrantResult | null = null;

  for (const quest of quests) {
    if (quest.completedAt || quest.action !== action) continue;
    quest.progressCount = Math.min(quest.targetCount, quest.progressCount + amount);
    if (quest.progressCount >= quest.targetCount) {
      const result = completeQuest(quest);
      if (result?.leveledUp) levelUp = result;
    }
  }

  writeQuests(quests);
  syncWeeklyBossQuest();
  return levelUp;
}

export function getQuestProgress(): QuestProgressView {
  const quests = ensureQuests();
  const items = quests.map((quest) => ({
    id: quest.id,
    label: quest.title,
    done: Boolean(quest.completedAt),
    xp: quest.xpReward,
    questType: quest.questType,
  }));
  const completed = items.filter((item) => item.done).length;
  const activeDaily = quests.find(
    (quest) => quest.questType === "daily" && !quest.completedAt,
  );

  return {
    completed,
    total: items.length,
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
    items,
    activeDailyQuest: activeDaily?.description ?? null,
  };
}

export function ensureProfileQuest() {
  ensureQuests();
  const quests = readQuests();
  if (quests.some((quest) => quest.action === "complete_profile")) return quests;
  quests.push({
    id: "profile-complete-once",
    title: "Complete profile",
    description: "Fill in your health profile details.",
    questType: "daily",
    action: "complete_profile",
    targetCount: 1,
    progressCount: 0,
    xpReward: 20,
    dueDate: todayKey(),
    completedAt: null,
  });
  writeQuests(quests);
  return quests;
}

export function syncQuestsFromDayState() {
  const today = storage.getToday();
  if (today.fastingSugar) recordQuestAction("log_glucose");
  if (today.meals.length > 0) recordQuestAction("log_meal");
  if (today.medsTaken) recordQuestAction("confirm_meds");
  if (today.eveningSummary) recordQuestAction("evening_summary");
  syncWeeklyBossQuest();
}
