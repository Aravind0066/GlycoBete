export type AppTheme = "midnight" | "forest" | "sunrise" | "ocean";

export interface EmergencyInfo {
  emergencyContact: string;
  emergencyPhone: string;
  doctorName: string;
  doctorPhone: string;
  bloodGroup: string;
}

export interface UserProfile {
  name: string;
  mode: "patient" | "family";
  class: "warrior" | "mage" | "healer";
  age: string;
  gender: string;
  diabetesType: string;
  medications: string;
  theme: AppTheme;
  emergencyContact: string;
  emergencyPhone: string;
  doctorName: string;
  doctorPhone: string;
  bloodGroup: string;
}

export interface HealthMetrics {
  currentGlucose: number | null;
  weeklyAverage: number | null;
  highestReading: number | null;
  lowestReading: number | null;
  hba1cEstimate: number | null;
  daysInRange: number;
  totalDays: number;
  mealsLogged: number;
  medicationAdherence: number;
  exerciseMinutes: number;
  waterGlasses: number;
  healthScore: number;
  glucoseTrend: "improving" | "stable" | "worsening";
  monthImprovement: number;
}

export interface RiskPrediction {
  hypoglycemiaRisk: "low" | "medium" | "high";
  hyperglycemiaRisk: "low" | "medium" | "high";
  summary: string;
  factors: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DietRecommendation {
  breakfast: string;
  lunch: string;
  dinner: string;
  tips: string[];
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
