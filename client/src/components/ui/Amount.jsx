import { cn } from "../../utils/cn.js";
import { formatMoney } from "../../utils/format.js";

const TONES = { neutral: "text-ink", owe: "text-negative", owed: "text-positive", muted: "text-muted" };

/**
 * Money, always with tabular figures. `tone` encodes direction:
 *  owe = you pay (red), owed = you receive (green). `sign` adds +/−.
 */
export default function Amount({ value, tone = "neutral", sign = false, className }) {
  const prefix = sign ? (tone === "owe" ? "−" : tone === "owed" ? "+" : "") : "";
  return (
    <span className={cn("tnum whitespace-nowrap", TONES[tone], className)}>
      {prefix}
      {formatMoney(value)}
    </span>
  );
}
