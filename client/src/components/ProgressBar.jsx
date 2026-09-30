import { cn } from "../utils/cn.js";

/**
 * Budget meter. Colour follows meaning: calm by default, amber when
 * approaching the limit, red once it's exceeded.
 */
export default function ProgressBar({ percent, overBudget, label = "Budget used" }) {
  const value = Math.max(0, Math.min(percent || 0, 100));
  const tone = overBudget ? "bg-negative" : percent >= 85 ? "bg-warning-fill" : "bg-primary";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone)} style={{ width: `${value}%` }} />
    </div>
  );
}
