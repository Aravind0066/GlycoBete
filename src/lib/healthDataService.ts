import type { DayLog, GameState, PartyMember, UserProfile } from "./types";
import { storage } from "./gameEngine";

export type HealthDataService = {
  getProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  getGameState: () => Promise<GameState>;
  saveGameState: (game: GameState) => Promise<void>;
  getTodayLog: () => Promise<DayLog>;
  saveDayLog: (day: DayLog) => Promise<void>;
  getPartyMembers: () => Promise<PartyMember[]>;
  savePartyMembers: (members: PartyMember[]) => Promise<void>;
};

export const localHealthDataService: HealthDataService = {
  getProfile: async () => storage.getProfile(),
  saveProfile: async (profile) => storage.setProfile(profile),
  getGameState: async () => storage.getGame(),
  saveGameState: async (game) => storage.setGame(game),
  getTodayLog: async () => storage.getToday(),
  saveDayLog: async (day) => storage.saveDay(day),
  getPartyMembers: async () => storage.getParty(),
  savePartyMembers: async (members) => storage.setParty(members),
};

export function getHealthDataService() {
  return localHealthDataService;
}
