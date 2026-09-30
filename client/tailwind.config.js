/** @type {import('tailwindcss').Config} */

// Every colour is a CSS variable holding "R G B" channels (defined in
// src/index.css) so utilities like `bg-primary/10` keep working while the
// palette lives in exactly one place.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    // Radius and shadow are *replaced*, not extended, so arbitrary values
    // like rounded-2xl or shadow-xl can't creep back in.
    borderRadius: {
      none: "0",
      control: "6px", // buttons, inputs, chips, small blocks
      panel: "10px", // panels, popovers
      full: "9999px", // avatars, pills, meters
    },
    boxShadow: {
      none: "none",
      pop: "0 8px 24px -8px rgb(16 24 40 / 0.18), 0 0 0 1px rgb(16 24 40 / 0.06)",
    },
    extend: {
      colors: {
        canvas: token("canvas"), // page background
        surface: token("surface"), // panels, inputs, sidebar
        sunken: token("sunken"), // hover fills, tracks, quiet blocks
        line: token("line"), // hairline dividers & panel borders
        "line-strong": token("line-strong"), // button borders, emphasis rules
        control: token("control"), // form-control borders (>= 3:1)
        ink: token("ink"), // primary text
        muted: token("muted"), // secondary text
        subtle: token("subtle"), // tertiary text, placeholders (still >= 4.5:1)
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          soft: token("primary-soft"),
        },
        positive: { DEFAULT: token("positive"), soft: token("positive-soft") },
        negative: { DEFAULT: token("negative"), soft: token("negative-soft") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), fill: token("warning-fill") },
        // Muted tint pairs, used for avatars only.
        tint: {
          1: token("tint-1"),
          2: token("tint-2"),
          3: token("tint-3"),
          4: token("tint-4"),
          5: token("tint-5"),
        },
        "tint-ink": {
          1: token("tint-1-ink"),
          2: token("tint-2-ink"),
          3: token("tint-3-ink"),
          4: token("tint-4-ink"),
          5: token("tint-5-ink"),
        },
      },
      fontFamily: {
        sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      // A fixed, named type scale. Use these instead of ad-hoc sizes.
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em" }], // 11px eyebrow labels
        small: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px captions, labels, meta
        body: ["0.875rem", { lineHeight: "1.375rem" }], // 14px default UI text
        heading: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.005em" }], // 16px section titles
        title: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }], // 24px page titles
        figure: ["1.75rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }], // 28px headline numbers
        display: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.025em" }], // 32px auth headline
      },
      maxWidth: {
        form: "45rem", // 720  - single-column forms & lists
        page: "60rem", // 960  - standard pages
        wide: "70rem", // 1120 - dashboards
      },
      transitionDuration: { DEFAULT: "150ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.2, 0, 0, 1)" },
    },
  },
  plugins: [],
};
