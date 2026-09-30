import { Check } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * A pressable pill for multi-select choices (friends, participants).
 * Selection is shown with a check mark as well as colour, so it doesn't
 * rely on colour alone.
 */
export default function ToggleChip({ selected, onClick, children, className, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-small transition-colors",
        selected
          ? "border-primary bg-primary-soft font-medium text-primary"
          : "border-line-strong bg-surface text-muted hover:bg-sunken hover:text-ink",
        className
      )}
      {...rest}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />}
      {children}
    </button>
  );
}
