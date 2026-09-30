import { cn } from "../../utils/cn.js";
import { initials } from "../../utils/format.js";

const TINTS = ["bg-tint-1 text-tint-ink-1", "bg-tint-2 text-tint-ink-2", "bg-tint-3 text-tint-ink-3", "bg-tint-4 text-tint-ink-4", "bg-tint-5 text-tint-ink-5"];
const SIZES = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-micro", md: "h-9 w-9 text-small" };

// Same name always gets the same tint, so people are recognisable at a glance.
function tintFor(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export default function Avatar({ name, size = "md", short = false, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-normal", SIZES[size], tintFor(name), className)}
    >
      {short ? initials(name).slice(0, 1) : initials(name)}
    </span>
  );
}

/** Overlapping stack of avatars with a "+N" overflow. */
export function AvatarStack({ names = [], max = 4, size = "xs" }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="flex items-center" aria-hidden="true">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} short className="-ml-1.5 ring-2 ring-surface first:ml-0" />
      ))}
      {extra > 0 && (
        <span className="-ml-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sunken px-1 text-[10px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      )}
    </span>
  );
}
