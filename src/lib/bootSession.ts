const BOOT_KEY = "glyco-boot-complete";

export function markBootComplete() {
  try {
    sessionStorage.setItem(BOOT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** True once after the splash finishes — consumed so the next page skips a second full loader. */
export function consumeBootComplete() {
  try {
    if (sessionStorage.getItem(BOOT_KEY) !== "1") return false;
    sessionStorage.removeItem(BOOT_KEY);
    return true;
  } catch {
    return false;
  }
}
