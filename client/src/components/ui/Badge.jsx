import { cn } from "../../utils/cn.js";

const TONES = {
  neutral: { pill: "bg-sunken text-muted", dot: "bg-subtle" },
  primary: { pill: "bg-primary-soft text-primary", dot: "bg-primary" },
  positive: { pill: "bg-positive-soft text-positive", dot: "bg-positive" },
  negative: { pill: "bg-negative-soft text-negative", dot: "bg-negative" },
  warning: { pill: "bg-warning-soft text-warning", dot: "bg-warning" },
};

/** Small status label. The dot means status isn't communicated by colour alone. */
export default function Badge({ tone = "neutral", dot = true, children, className }) {
  const t = TONES[tone];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-small font-medium", t.pill, className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
