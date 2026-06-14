import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type AuthSession = {
  email: string;
  userId: string;
  provider: "google" | "email" | "local";
};

const LOCAL_USERS_KEY = "gb_local_users";
const LOCAL_SESSION_KEY = "gb_auth_session";

type LocalUserRecord = {
  email: string;
  password: string;
  createdAt: string;
};

function readLocalUsers(): LocalUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: LocalUserRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function saveLocalSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_SESSION_KEY);
  if (supabase) void supabase.auth.signOut();
}

export function isGoogleAuthAvailable() {
  return isSupabaseConfigured;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthSession> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password.length < 6) {
    throw new Error("Use a valid email and a password with at least 6 characters.");
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email: normalized, password });
    if (error) throw new Error(error.message);
    const user = data.user;
    if (!user?.email) throw new Error("Sign up failed. Please try again.");
    const session: AuthSession = {
      email: user.email,
      userId: user.id,
      provider: "email",
    };
    saveLocalSession(session);
    return session;
  }

  const users = readLocalUsers();
  if (users.some((user) => user.email === normalized)) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  users.push({ email: normalized, password, createdAt: new Date().toISOString() });
  writeLocalUsers(users);
  const session: AuthSession = {
    email: normalized,
    userId: `local-${normalized}`,
    provider: "local",
  };
  saveLocalSession(session);
  return session;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) throw new Error("Enter your email and password.");

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) throw new Error(error.message);
    const user = data.user;
    if (!user?.email) throw new Error("Sign in failed. Please try again.");
    const session: AuthSession = {
      email: user.email,
      userId: user.id,
      provider: "email",
    };
    saveLocalSession(session);
    return session;
  }

  const users = readLocalUsers();
  const match = users.find((user) => user.email === normalized && user.password === password);
  if (!match) throw new Error("Email or password is incorrect.");
  const session: AuthSession = {
    email: normalized,
    userId: `local-${normalized}`,
    provider: "local",
  };
  saveLocalSession(session);
  return session;
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    throw new Error("Google sign-in needs Supabase configured in your .env file.");
  }
  const redirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function restoreSupabaseSession(): Promise<AuthSession | null> {
  if (!supabase) return getAuthSession();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.email) return getAuthSession();
  const session: AuthSession = {
    email: user.email,
    userId: user.id,
    provider: user.app_metadata?.provider === "google" ? "google" : "email",
  };
  saveLocalSession(session);
  return session;
}

export async function completeOAuthIfNeeded(): Promise<AuthSession | null> {
  if (!supabase) return getAuthSession();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const user = data.session?.user;
  if (!user?.email) return getAuthSession();
  const session: AuthSession = {
    email: user.email,
    userId: user.id,
    provider: user.app_metadata?.provider === "google" ? "google" : "email",
  };
  saveLocalSession(session);
  return session;
}
