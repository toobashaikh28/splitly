import { cn } from "../../utils/cn.js";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";
import { RefreshCw } from "lucide-react";

export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-control bg-sunken", className)} />;
}

/** A list-shaped skeleton: matches the rows it stands in for, avoiding layout jump. */
export function ListSkeleton({ rows = 3, className }) {
  return (
    <div role="status" aria-label="Loading" className={cn("divide-y divide-line rounded-panel border border-line bg-surface", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Nothing here yet: says what this space is for and offers the next step. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("rounded-panel border border-dashed border-line-strong px-6 py-10 text-center", className)}>
      {Icon && <Icon className="mx-auto mb-3 h-5 w-5 text-subtle" strokeWidth={1.75} aria-hidden="true" />}
      <p className="text-body font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-body text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** A load failed. Always offers a retry. */
export function ErrorState({ message, onRetry, className }) {
  return (
    <div role="alert" className={cn("rounded-panel border border-line bg-surface px-6 py-10 text-center", className)}>
      <p className="text-body font-medium text-ink">We couldn't load this</p>
      <p className="mx-auto mt-1 max-w-sm text-body text-muted">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** Full-page wait (route guards, first paint). */
export function PageSpinner({ label = "Loading" }) {
  return (
    <div role="status" className="flex min-h-[40vh] items-center justify-center gap-2 text-body text-muted">
      <Spinner className="h-4 w-4" />
      {label}
    </div>
  );
}
