import type { DayLog, GameState, PartyMember, PrescriptionMed, UserProfile } from "./types";
import type { MealAnalysis, DailySummary } from "./geminiApi";
import { getProfileFn, saveProfileFn, updateThemeFn, hasProfileFn, updateEmergencyFn } from "./functions/profile";
import {
  getGameFn,
  setGameFn,
  grantXpFn,
  unlockAchievementFn,
  updateStreakFn,
  checkBossWeekFn,
  spendCoinsFn,
  setActiveQuestFn,
  evaluateBossFn,
  completeQuestFn,
} from "./functions/game";
import { getTodayFn, saveDayFn, getLast7DaysFn, getDaysInRangeFn } from "./functions/days";
import { getPartyFn, setPartyFn, getMedsFn, setMedsFn } from "./functions/party";
import {
  analyzeMealFn,
  analyzeDayFn,
  analyzeWeekFn,
  readPrescriptionFn,
  chatAssistantFn,
  dietRecommendationsFn,
} from "./functions/ai";
import { getHealthDashboardFn } from "./functions/health";
import { migrateLocalDataFn } from "./functions/migrate";
import type { AppTheme } from "./types";
import type { WeeklyInsights } from "./types";
import type { XPGrantResult } from "./gameEngine";

export const api = {
  hasProfile: () => hasProfileFn(),
  getProfile: () => getProfileFn(),
  saveProfile: (profile: UserProfile) => saveProfileFn({ data: profile }),
  updateTheme: (theme: AppTheme) => updateThemeFn({ data: { theme } }),
  updateEmergency: (info: {
    emergencyContact: string;
    emergencyPhone: string;
    doctorName: string;
    doctorPhone: string;
    bloodGroup: string;
  }) => updateEmergencyFn({ data: info }),

  getGame: () => getGameFn(),
  setGame: (game: GameState) => setGameFn({ data: game }),
  grantXP: (amount: number, classType?: string) =>
    grantXpFn({ data: { amount, classType: classType as UserProfile["class"] | undefined } }),
  unlockAchievement: (id: string) => unlockAchievementFn({ data: { id } }),
  updateStreak: (todayKey: string, yesterdayKey: string) =>
    updateStreakFn({ data: { todayKey, yesterdayKey } }),
  checkBossWeek: (weekStartKey: string) => checkBossWeekFn({ data: { weekStartKey } }),
  evaluateBoss: () => evaluateBossFn(),
  completeQuest: () => completeQuestFn(),
  spendCoins: (amount: number) => spendCoinsFn({ data: { amount } }),
  setActiveQuest: (quest: string | null) => setActiveQuestFn({ data: { quest } }),

  getHealthDashboard: () => getHealthDashboardFn(),

  getToday: () => getTodayFn(),
  saveDay: (day: DayLog) => saveDayFn({ data: day }),
  getLast7Days: () => getLast7DaysFn(),
  getDaysInRange: (startDate: string, endDate: string) =>
    getDaysInRangeFn({ data: { startDate, endDate } }),

  getParty: () => getPartyFn(),
  setParty: (members: PartyMember[]) => setPartyFn({ data: members }),
  getMeds: () => getMedsFn(),
  setMeds: (meds: PrescriptionMed[]) => setMedsFn({ data: meds }),

  analyzeMeal: (meal: string, diabetesType: string) =>
    analyzeMealFn({ data: { meal, diabetesType } }) as Promise<MealAnalysis>,
  analyzeDay: (args: Parameters<typeof analyzeDayFn>[0]["data"]) =>
    analyzeDayFn({ data: args }) as Promise<DailySummary>,
  analyzeWeek: (week: unknown[]) =>
    analyzeWeekFn({ data: { week } }) as Promise<WeeklyInsights>,
  readPrescription: (base64: string, mimeType: string) =>
    readPrescriptionFn({ data: { base64, mimeType } }),
  chatAssistant: (args: {
    message: string;
    diabetesType: string;
    name: string;
    recentGlucose: number | null;
    history: { role: string; content: string }[];
  }) => chatAssistantFn({ data: args }),
  getDietRecommendations: (args: {
    name: string;
    diabetesType: string;
    age: string;
    avgGlucose: number | null;
  }) => dietRecommendationsFn({ data: args }),

  migrateLocalData: (payload: Parameters<typeof migrateLocalDataFn>[0]["data"]) =>
    migrateLocalDataFn({ data: payload }),
};

export type { XPGrantResult };
