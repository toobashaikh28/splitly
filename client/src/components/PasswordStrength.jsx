import { cn } from "../utils/cn.js";
import { passwordStrength } from "../utils/validate.js";

const LEVELS = [
  { label: "Too short", bar: "bg-negative", text: "text-negative" },
  { label: "Fair", bar: "bg-warning-fill", text: "text-warning" },
  { label: "Good", bar: "bg-primary", text: "text-primary" },
  { label: "Strong", bar: "bg-positive", text: "text-positive" },
];

/** Three-segment meter. The word carries the meaning; colour only reinforces it. */
export default function PasswordStrength({ password }) {
  if (!password) return null;
  const level = passwordStrength(password);
  const { label, bar, text } = LEVELS[level];
  const filled = Math.max(level, 1);
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-1 flex-1 rounded-full", n <= filled ? bar : "bg-sunken")} />
        ))}
      </div>
      <span role="status" className={cn("text-small font-medium", text)}>
        <span className="sr-only">Password strength: </span>
        {label}
      </span>
    </div>
  );
}
