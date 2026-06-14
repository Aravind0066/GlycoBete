export function calculateAgeFromDob(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function ageLabelFromDob(dateOfBirth: string): string {
  const age = calculateAgeFromDob(dateOfBirth);
  if (age == null) return "";
  if (age < 18) return "Under 18";
  if (age <= 40) return "18–40";
  if (age <= 60) return "41–60";
  return "60+";
}

export function formatAgeDisplay(dateOfBirth: string): string {
  const age = calculateAgeFromDob(dateOfBirth);
  return age == null ? "" : `${age} years`;
}

export function isValidDob(dateOfBirth: string): boolean {
  const age = calculateAgeFromDob(dateOfBirth);
  return age != null && age >= 1 && age <= 120;
}
