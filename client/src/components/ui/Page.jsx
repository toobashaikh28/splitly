import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../utils/cn.js";

const WIDTHS = { form: "max-w-form", page: "max-w-page", wide: "max-w-wide" };

/** Page container: one horizontal gutter, three content widths. */
export function Page({ width = "page", className, children }) {
  return <div className={cn("w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", WIDTHS[width], className)}>{children}</div>;
}

/** Title block used on every page, so hierarchy is identical everywhere. */
export function PageHeader({ title, description, actions, back, className }) {
  return (
    <header className={cn("mb-8", className)}>
      {back && (
        <Link
          to={back.to}
          className="-ml-1 mb-3 inline-flex items-center gap-1 rounded-control px-1 py-0.5 text-small text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-title font-semibold text-ink">{title}</h1>
          {description && <p className="mt-1 text-body text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A titled region of a page. Header row supports an optional right-aligned action. */
export function Section({ title, description, action, className, children, ...rest }) {
  return (
    <section className={cn("min-w-0", className)} {...rest}>
      {(title || action) && (
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            {title && <h2 className="text-heading font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Bordered surface. Flat: separation comes from the hairline, not a shadow. */
export function Panel({ as: Component = "div", padded = false, className, children, ...rest }) {
  return (
    <Component className={cn("rounded-panel border border-line bg-surface", padded && "p-5", className)} {...rest}>
      {children}
    </Component>
  );
}

/** Consistent small link used for "View all" style actions. */
export function TextLink({ to, children }) {
  return (
    <Link to={to} className="rounded-control text-small font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}

/**
 * Main column plus a summary rail. The rail sits beside the content from `xl`
 * up; below that there is no room for two columns, so it follows the content
 * at the old single-column width.
 */
export function PageColumns({ aside, children }) {
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 max-w-form xl:max-w-none">{children}</div>
      {aside && (
        <aside aria-label="Summary" className="min-w-0 max-w-form space-y-6 xl:sticky xl:top-10 xl:max-w-none xl:self-start">
          {aside}
        </aside>
      )}
    </div>
  );
}

/** A titled block in the summary rail. */
export function AsidePanel({ title, action, children, className }) {
  return (
    <Panel as="section" padded className={className}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-body font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Panel>
  );
}

/** Label / value pairs inside an AsidePanel. Renders a description list. */
export function StatList({ children }) {
  return <dl className="space-y-2.5">{children}</dl>;
}

export function Stat({ label, children, emphasis = false }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-body">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("tnum text-right", emphasis ? "font-semibold text-ink" : "text-ink")}>{children}</dd>
    </div>
  );
}
