import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";
import Spinner from "./Spinner.jsx";

const VARIANTS = {
  // The one main action on a screen.
  primary: "bg-primary text-white hover:bg-primary-hover",
  // Everything else that is a real action.
  secondary: "border border-line-strong bg-surface text-ink hover:bg-sunken",
  // Low-emphasis, inline actions.
  ghost: "text-muted hover:bg-sunken hover:text-ink",
  // Destructive or "leave" actions.
  danger: "text-negative hover:bg-negative-soft",
};

const SIZES = {
  sm: "h-8 px-3 text-small gap-1.5",
  md: "h-10 px-4 text-body gap-2",
};

/**
 * Polymorphic button. Render as a router link with `as={Link} to="..."`.
 * `loading` disables the control and shows a spinner in place of the icon.
 */
const Button = forwardRef(function Button(
  { as: Component = "button", variant = "secondary", size = "md", loading = false, icon: Icon, className, children, type, disabled, ...rest },
  ref
) {
  const isButton = Component === "button";
  return (
    <Component
      ref={ref}
      {...(isButton ? { type: type || "button", disabled: disabled || loading } : {})}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap rounded-control font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" /> : null}
      {children}
    </Component>
  );
});

export default Button;
