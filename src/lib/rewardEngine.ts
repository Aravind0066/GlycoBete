import {
  grantXP,
  storage,
  unlockAchievement,
  updateStreakOnCheckin,
  XP_REWARDS,
  type XPGrantResult,
} from "./gameEngine";
import { recordQuestAction, syncWeeklyBossQuest } from "./questEngine";

const ACHIEVEMENT_ALIASES: Record<string, string> = {
  first_blood: "first_glucose_log",
  week_warrior: "seven_day_streak",
};

export function normalizeAchievementId(id: string) {
  return ACHIEVEMENT_ALIASES[id] ?? id;
}

export function unlockAchievementWithAlias(id: string) {
  const normalized = normalizeAchievementId(id);
  const unlocked = unlockAchievement(normalized);
  if (normalized !== id) unlockAchievement(id);
  return unlocked;
}

export function rewardGlucoseCheckin(): XPGrantResult {
  updateStreakOnCheckin();
  const streakResult = grantXP(XP_REWARDS.morning_checkin);
  recordQuestAction("log_glucose");
  const game = storage.getGame();
  if (game.streak >= 7) {
    unlockAchievementWithAlias("seven_day_streak");
    unlockAchievementWithAlias("week_warrior");
  }
  unlockAchievementWithAlias("first_glucose_log");
  syncWeeklyBossQuest();
  return streakResult;
}

export function rewardMealLog(classType?: string): XPGrantResult {
  const result = grantXP(XP_REWARDS.meal_log, classType);
  recordQuestAction("log_meal");
  unlockAchievementWithAlias("meal_tracker");
  unlockAchievementWithAlias("first_blood");
  syncWeeklyBossQuest();
  return result;
}

export function rewardMedicationConfirm(): XPGrantResult | null {
  recordQuestAction("confirm_meds");
  return null;
}

export function rewardProfileComplete(): XPGrantResult | null {
  unlockAchievementWithAlias("profile_complete");
  return null;
}

export function rewardCoachChat(): XPGrantResult | null {
  recordQuestAction("coach_chat");
  unlockAchievementWithAlias("coach_chat");
  return null;
}

export function rewardEveningSummary(): XPGrantResult {
  const result = grantXP(XP_REWARDS.evening_summary);
  recordQuestAction("evening_summary");
  unlockAchievementWithAlias("night_owl");
  syncWeeklyBossQuest();
  return result;
}

export function rewardPrescriptionUpload(): XPGrantResult {
  return grantXP(XP_REWARDS.prescription_upload);
}

export function rewardBossDefeat(): XPGrantResult | null {
  const game = storage.getGame();
  if (game.bossDefeated) return null;
  game.bossDefeated = true;
  storage.setGame(game);
  unlockAchievementWithAlias("boss_slayer");
  return grantXP(XP_REWARDS.boss_defeated);
}
