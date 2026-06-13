import type { AppTheme } from "./types";

export const THEMES: {
  id: AppTheme;
  label: string;
  icon: string;
  description: string;
}[] = [
  { id: "midnight", label: "Midnight", icon: "🌙", description: "Classic RPG dark" },
  { id: "forest", label: "Forest", icon: "🌲", description: "Healer green tones" },
  { id: "sunrise", label: "Sunrise", icon: "🌅", description: "Warm amber light" },
  { id: "ocean", label: "Ocean", icon: "🌊", description: "Mage blue cyan" },
];

export function nextTheme(current: AppTheme): AppTheme {
  const idx = THEMES.findIndex((t) => t.id === current);
  return THEMES[(idx + 1) % THEMES.length].id;
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function themeMeta(theme: AppTheme) {
  return THEMES.find((t) => t.id === theme) ?? THEMES[0];
}
