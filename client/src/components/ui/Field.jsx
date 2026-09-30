import { forwardRef, useId, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn.js";

const CONTROL =
  "block h-10 w-full rounded-control border bg-surface px-3 text-ink transition-colors " +
  // 16px on small screens stops iOS Safari zooming the page on focus.
  "text-base sm:text-body placeholder:text-subtle " +
  "hover:border-ink/40 focus:border-primary focus-visible:outline-offset-0 " +
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-subtle";

function FieldShell({ id, label, hint, error, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-small font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1.5 text-small text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="mt-1.5 text-small text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Text-like input with a real, associated <label>.
 * `prefix` / `suffix` render a unit ("Rs.", "%") inside the field; `icon` a leading glyph.
 */
export const Input = forwardRef(function Input(
  { label, hint, error, prefix, suffix, icon: Icon, className, inputClassName, id: idProp, ...rest },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} aria-hidden="true" />}
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body text-subtle">{prefix}</span>}
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-body text-subtle">{suffix}</span>}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(CONTROL, error ? "border-negative" : "border-control", Icon && "pl-9", prefix && "pl-10", suffix && "pr-8", inputClassName)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

/** Native <select> (best accessibility and mobile UX) with a custom chevron. */
export const Select = forwardRef(function Select(
  { label, hint, error, className, id: idProp, children, ...rest },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(CONTROL, "appearance-none pr-9", error ? "border-negative" : "border-control")}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" strokeWidth={1.75} aria-hidden="true" />
      </div>
    </FieldShell>
  );
});

/**
 * Password field with a show/hide toggle and a Caps Lock warning.
 * The toggle is a real button (not in the tab order trap) with a stable label
 * and aria-pressed, so screen readers announce state rather than a new name.
 */
export const PasswordInput = forwardRef(function PasswordInput(
  { label, hint, error, className, id: idProp, onKeyUp, onKeyDown, onBlur, ...rest },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const [visible, setVisible] = useState(false);
  const [caps, setCaps] = useState(false);
  const track = (e) => setCaps(Boolean(e.getModifierState?.("CapsLock")));
  const message = caps && !error ? "Caps Lock is on." : hint;
  return (
    <FieldShell id={id} label={label} hint={message} error={error} className={className}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || message ? `${id}-msg` : undefined}
          className={cn(CONTROL, error ? "border-negative" : "border-control", "pr-11")}
          onKeyDown={(e) => {
            track(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            track(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCaps(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label="Show password"
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-muted transition-colors hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" /> : <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
});
