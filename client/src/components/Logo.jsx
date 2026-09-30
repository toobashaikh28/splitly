import { cn } from "../utils/cn.js";

/** Receipt glyph: a slip with a torn edge and two line items. */
export function LogoMark({ inverted = false, className }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7", className)} aria-hidden="true">
      <rect width="28" height="28" rx="6" className={inverted ? "fill-white" : "fill-primary"} />
      <path d="M8.5 6.5h11v15l-2.75-1.75L14 21.5l-2.75-1.75L8.5 21.5z" className={inverted ? "fill-primary" : "fill-white"} />
      <path
        d="M11.25 11h5.5M11.25 14.25h3.5"
        className={inverted ? "stroke-white" : "stroke-primary"}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** `inverted` is for use on the brand-coloured panel. */
export default function Logo({ inverted = false, className }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark inverted={inverted} />
      <span className={cn("text-heading font-semibold tracking-tight", inverted ? "text-white" : "text-ink")}>Splitly</span>
    </span>
  );
}
