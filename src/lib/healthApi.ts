import { getJson, postJson, putJson } from "./apiClient";
import type { DayLog, GameState, PartyMember, QuestRecord, UserProfile } from "./types";

export type AuthUser = {
  id: string;
  displayName: string;
  hasProfile?: boolean;
  authenticated?: boolean;
};

export type BootstrapData = {
  profile: UserProfile | null;
  game: GameState;
  days: Record<string, DayLog>;
  party: PartyMember[];
  meds: unknown[];
  quests: QuestRecord[];
};

export function login(name: string) {
  return postJson<AuthUser & { hasProfile?: boolean }>("/api/auth/login", { name }).then(
    async (user) => {
      const me = await getMe();
      return { ...user, hasProfile: me.hasProfile };
    },
  );
}

export function logout() {
  return postJson<{ ok: boolean }>("/api/auth/logout", {});
}

export function getMe() {
  return getJson<AuthUser & { authenticated: boolean; hasProfile?: boolean }>("/api/auth/me");
}

export function fetchBootstrap() {
  return getJson<BootstrapData>("/api/bootstrap");
}

export function saveProfile(profile: UserProfile) {
  return putJson<UserProfile>("/api/profile", profile);
}

export function saveGame(game: GameState) {
  return putJson<GameState>("/api/game", game);
}

export function saveDay(day: DayLog) {
  return putJson<DayLog>(`/api/days/${day.date}`, day);
}

export function saveParty(members: PartyMember[]) {
  return putJson<PartyMember[]>("/api/party", members);
}

export function saveMeds(meds: unknown[]) {
  return putJson<unknown[]>("/api/meds", meds);
}

export function saveQuests(quests: QuestRecord[]) {
  return putJson<QuestRecord[]>("/api/quests", quests);
}
