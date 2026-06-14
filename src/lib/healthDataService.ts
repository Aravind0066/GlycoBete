import type { DayLog, GameState, PartyMember, UserProfile } from "./types";
import { storage, hydrateFromBackend } from "./gameEngine";
import * as healthApi from "./healthApi";

export type HealthDataService = {
  getProfile: () => Promise<UserProfile | null>;
  saveProfile: (profile: UserProfile) => Promise<void>;
  getGameState: () => Promise<GameState>;
  saveGameState: (game: GameState) => Promise<void>;
  getTodayLog: () => Promise<DayLog>;
  saveDayLog: (day: DayLog) => Promise<void>;
  getPartyMembers: () => Promise<PartyMember[]>;
  savePartyMembers: (members: PartyMember[]) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const backendHealthDataService: HealthDataService = {
  hydrate: () => hydrateFromBackend(),
  getProfile: async () => {
    await hydrateFromBackend();
    return storage.getProfile();
  },
  saveProfile: async (profile) => {
    storage.setProfile(profile);
    await healthApi.saveProfile(profile);
  },
  getGameState: async () => {
    await hydrateFromBackend();
    return storage.getGame();
  },
  saveGameState: async (game) => {
    storage.setGame(game);
    await healthApi.saveGame(game);
  },
  getTodayLog: async () => {
    await hydrateFromBackend();
    return storage.getToday();
  },
  saveDayLog: async (day) => {
    storage.saveDay(day);
    await healthApi.saveDay(day);
  },
  getPartyMembers: async () => {
    await hydrateFromBackend();
    return storage.getParty();
  },
  savePartyMembers: async (members) => {
    storage.setParty(members);
    await healthApi.saveParty(members);
  },
};

export function getHealthDataService() {
  return backendHealthDataService;
}
