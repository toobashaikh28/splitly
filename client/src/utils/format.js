// Single source of truth for how money, dates and names are displayed.

const NBSP = "\u00A0";

/** 1250 -> "1,250", 1250.5 -> "1,250.50" (decimals only when needed) */
export function formatNumber(value) {
  const n = Number(value) || 0;
  const hasDecimals = Math.abs(n % 1) > 0.000001;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** 1250 -> "Rs. 1,250" (non-breaking space so it never wraps mid-amount) */
export function formatMoney(value) {
  return `Rs.${NBSP}${formatNumber(value)}`;
}

/** Always two decimals, for totals in the expense form. */
export function formatMoneyExact(value) {
  const n = Number(value) || 0;
  return `Rs.${NBSP}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(name = "") {
  return name.replace(/^@/, "").slice(0, 2).toUpperCase() || "?";
}

/** Only allow same-site paths as post-login destinations (prevents open redirects). */
export function safeRedirect(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}
