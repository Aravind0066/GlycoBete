import { getCookie, setCookie } from "@tanstack/react-start/server";

export const SESSION_COOKIE = "gb_session";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function readSessionUserId(): string | null {
  return getCookie(SESSION_COOKIE) ?? null;
}

export function setSessionUserId(userId: string) {
  setCookie(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
    secure: process.env.NODE_ENV === "production",
  });
}
