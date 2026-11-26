/**
 * Client-side input validation and sanitizing (extra credit: cyber security).
 *
 * The backend validates everything again (Pydantic), so this is about giving
 * quick, friendly errors and never sending junk. React already escapes any
 * text it renders, and we never use dangerouslySetInnerHTML, which blocks XSS.
 */

// Control characters (except tab/newline) have no business in user text.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trim, drop control characters and cap the length. */
export function sanitizeText(value, maxLength = 500) {
  if (value == null) return "";
  return String(value).replace(CONTROL_CHARS, "").trim().slice(0, maxLength);
}

/** Review form: rating 1-5 and an optional comment up to 2000 chars. */
export function validateReview({ rating, comment }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Pick a rating from 1 to 5 stars.";
  }
  if (comment && comment.length > 2000) {
    return "Your review must be 2000 characters or fewer.";
  }
  return "";
}

/** Profile form, same limits as backend/src/app/schemas/user.py (UserUpdate). */
export function validateProfile({ display_name, bio, home_city }) {
  if (display_name && display_name.length > 100) return "Display name must be 100 characters or fewer.";
  if (bio && bio.length > 500) return "Bio must be 500 characters or fewer.";
  if (home_city && home_city.length > 100) return "Home city must be 100 characters or fewer.";
  return "";
}

/** Trip details form (TripUpdate in the backend). */
export function validateTrip({ name, budget }) {
  if (!name || !name.trim()) return "Give your trip a name.";
  if (name.length > 150) return "Trip name must be 150 characters or fewer.";
  if (budget !== "" && budget != null) {
    const n = Number(budget);
    if (!Number.isFinite(n) || n < 0) return "Budget must be a positive number.";
    if (n > 100000) return "Budget looks too large.";
  }
  return "";
}

/** Search box: short plain text only. */
export function sanitizeSearch(value) {
  return sanitizeText(value, 100);
}
