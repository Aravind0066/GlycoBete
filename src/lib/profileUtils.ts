import type { UserProfile } from "./types";

export function getProfileDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return "Player";
  if (profile.mode === "family") {
    return profile.patientName || profile.name || "Your loved one";
  }
  return profile.name || "Player";
}

export function getCaregiverName(profile: UserProfile | null | undefined): string | null {
  if (!profile || profile.mode !== "family") return null;
  return profile.caregiverName || profile.name || null;
}

export function isProfileComplete(profile: Partial<UserProfile> | null | undefined): boolean {
  if (!profile?.mode || !profile.class || !profile.gender || !profile.diabetesType) return false;
  if (!profile.dateOfBirth || !profile.medications?.trim()) return false;
  if (profile.mode === "family") {
    return Boolean(profile.caregiverName?.trim() && profile.patientName?.trim());
  }
  return Boolean(profile.name?.trim());
}

export function buildProfileForSave(profile: Partial<UserProfile>, email?: string): UserProfile {
  const dateOfBirth = profile.dateOfBirth ?? "";
  const age = profile.age || (dateOfBirth ? `${calculateAgeFromSave(dateOfBirth)} years` : "");

  return {
    email,
    name:
      profile.mode === "family"
        ? (profile.patientName ?? profile.name ?? "")
        : (profile.name ?? ""),
    patientName: profile.patientName,
    caregiverName: profile.caregiverName,
    mode: profile.mode ?? "patient",
    class: profile.class ?? "warrior",
    dateOfBirth,
    age,
    gender: profile.gender ?? "",
    diabetesType: profile.diabetesType ?? "",
    medications: profile.medications ?? "",
  };
}

function calculateAgeFromSave(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}
