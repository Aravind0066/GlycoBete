export interface UserProfile {
  name: string;
  mode: "patient" | "family";
  class: "warrior" | "mage" | "healer";
  age: string;
  gender: string;
  diabetesType: string;
  medications: string;
}

export interface MealLog {
  id: string;
  time: string;
  description: string;
  mealType: string;
  glycemicLevel: "low" | "medium" | "high";
  explanation: string;
  indianInsight: string;
  xpEarned: number;
}

export interface EveningSummary {
  controlStatus: "controlled" | "watch_out" | "alert";
  patternDetected: string;
  tomorrowsQuest: string;
  bossProgress: boolean;
}

export interface DayLog {
  date: string;
  fastingSugar: number | null;
  sleepQuality: number | null;
  symptoms: string[];
  medsTaken: boolean;
  meals: MealLog[];
  eveningSummary: EveningSummary | null;
}

export interface GameState {
  totalXP: number;
  level: number;
  levelTitle: string;
  streak: number;
  lastCheckinDate: string;
  healthCoins: number;
  achievements: string[];
  bossDefeated: boolean;
  bossWeekStart: string;
  activeQuest: string | null;
}

export interface PartyMember {
  id: string;
  name: string;
  relationship: string;
}

export interface PrescriptionMed {
  name: string;
  whatItDoes: string;
  whyYouTakeIt: string;
  sideEffects: string;
  ifYouMissDose: string;
}

export interface WeeklyInsights {
  weeklyNarrative: string;
  bestDay: string;
  worstDay: string;
  topRecommendation: string;
}
