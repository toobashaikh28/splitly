import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../../utils/cn.js";

const TONES = {
  error: { box: "bg-negative-soft", icon: "text-negative", Icon: AlertCircle, role: "alert" },
  success: { box: "bg-positive-soft", icon: "text-positive", Icon: CheckCircle2, role: "status" },
  warning: { box: "bg-warning-soft", icon: "text-warning", Icon: TriangleAlert, role: "status" },
  info: { box: "bg-primary-soft", icon: "text-primary", Icon: Info, role: "status" },
};

/** Inline feedback. Errors are announced immediately; the rest politely. */
export default function Alert({ tone = "info", children, action, onDismiss, className }) {
  const { box, icon, Icon, role } = TONES[tone];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-control px-3.5 py-3 text-body text-ink", box, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", icon)} strokeWidth={2} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 rounded-control p-1 text-muted hover:text-ink">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
