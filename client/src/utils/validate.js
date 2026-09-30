// Client-side checks for the auth forms. The server stays the source of truth;
// these exist so people see what to fix next to the field, before a round trip.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN = 6;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

/** Usernames are stored trimmed and lowercase, so compare like that. */
export const normalizeUsername = (v) => v.trim().toLowerCase();

export function emailError(v) {
  const value = v.trim();
  if (!value) return "Enter your email address.";
  if (!EMAIL_RE.test(value)) return "Enter a valid email address, like name@example.com.";
  return "";
}

export function usernameError(v) {
  const value = normalizeUsername(v);
  if (!value) return "Choose a username.";
  if (value.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters.`;
  if (value.length > USERNAME_MAX) return `Use ${USERNAME_MAX} characters or fewer.`;
  if (!/^[a-z0-9_.]+$/.test(value)) return "Use only letters, numbers, dots and underscores.";
  return "";
}

export function newPasswordError(v) {
  if (!v) return "Choose a password.";
  if (v.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  return "";
}

/** 0 = too short, 1 = fair, 2 = good, 3 = strong. A rough guide, not a guarantee. */
export function passwordStrength(v) {
  if (v.length < PASSWORD_MIN) return 0;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(v)).length;
  let score = 1;
  if (v.length >= 10) score += 1;
  if (variety >= 3) score += 1;
  return Math.min(score, 3);
}
