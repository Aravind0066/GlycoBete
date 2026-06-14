export const MEDICAL_SAFETY_NOTE =
  "GlycoBete is an educational assistant, not a doctor. For severe symptoms, very high or very low glucose, chest pain, confusion, fainting, or breathing trouble, seek urgent medical help.";

export function hasUrgentSymptoms(text = "") {
  return /chest pain|faint|fainted|confusion|can't breathe|cannot breathe|seizure|unconscious|blurred vision|vomiting|ketone|very low|very high/i.test(
    text,
  );
}

export function urgentWarning() {
  return "This may need urgent care. Please contact a doctor or local emergency service now, especially if symptoms are severe or glucose is dangerously high or low.";
}
