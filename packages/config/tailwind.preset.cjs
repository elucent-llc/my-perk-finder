/**
 * Shared Tailwind preset — MyPerkFinder design tokens.
 * Consumed by apps/web, apps/admin and packages/ui.
 *
 * ── Rules this file encodes ──────────────────────────────────────────────
 * COLOR    Teal `brand` = trust/value (CTAs, links, active state).
 *          Orange `accent` = discount + urgency only. Green `savings`,
 *          amber `warn`, red `danger` are semantic and used nowhere else.
 *          Every foreground/background pair below meets WCAG AA (4.5:1) for
 *          normal text. Do not pair white text with a -500 or -600 step.
 * RADIUS   Exactly three: `control` (buttons/inputs/selects), `card`
 *          (cards/panels/surfaces), `pill` (badges/chips). Never use
 *          rounded-lg / -xl / -2xl / -full — they created five competing
 *          systems and a visible radius mismatch inside a single column.
 * SHADOW   Exactly three: `card` at rest, `card-hover` on hover/focus,
 *          `overlay` for popovers and dropdowns. No stock shadow-sm/-lg,
 *          no one-off inline shadow values.
 * TYPE     Named steps below replace the ad-hoc text-[13.5px] style
 *          arbitrary values that had drifted across ~8 different sizes.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary — teal: trust + value. 700 is the lightest step that is
        // AA-safe (5.47:1) behind white text, so it is the CTA/link default.
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // Accent — orange: discounts and "hot" signals only.
        // 700 (5.18:1 on white text) is the discount-badge default; 500 is
        // decorative-only and must never carry white text (2.80:1).
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
        },
        // Ink — the page's neutral ramp. 700/800 previously duplicated
        // slate-800/slate-900 byte-for-byte, so the same colour was reachable
        // under two names. These are now distinct, cooler, and slightly
        // deeper than slate so headings read as deliberate.
        ink: {
          500: "#5b6b84",
          600: "#46566e",
          700: "#2b3a52",
          800: "#16233a",
          900: "#0b1120",
        },
        // Page background. Was a raw hex in globals.css, outside the palette.
        surface: {
          DEFAULT: "#ffffff",
          sunken: "#f4f6fa",
          raised: "#ffffff",
          muted: "#eef1f6",
        },
        savings: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
        },
        warn: {
          50: "#fffbeb",
          100: "#fef3c7",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },

      // Three radii. See RADIUS rule above.
      borderRadius: {
        control: "10px",
        card: "14px",
        pill: "999px",
      },

      // Three elevations. See SHADOW rule above.
      boxShadow: {
        card: "0 1px 2px rgba(11,17,32,.05), 0 1px 3px rgba(11,17,32,.04)",
        "card-hover": "0 6px 16px rgba(11,17,32,.09), 0 2px 5px rgba(11,17,32,.05)",
        overlay: "0 12px 32px rgba(11,17,32,.14), 0 4px 10px rgba(11,17,32,.07)",
      },

      // `--font-sans` comes from next/font on <html>. The fallback stack is
      // metric-adjacent so the swap does not shift layout.
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },

      // Named type steps, replacing ~8 arbitrary pixel values.
      fontSize: {
        micro: ["0.6875rem", { lineHeight: "1.45", letterSpacing: "0.005em" }], // 11px — meta, counts
        mini: ["0.78125rem", { lineHeight: "1.45" }], // 12.5px — chips, badges
        card: ["0.84375rem", { lineHeight: "1.4" }], // 13.5px — card titles, nav
        ui: ["0.9375rem", { lineHeight: "1.55" }], // 15px — inputs, panel heads
        subhead: ["1.0625rem", { lineHeight: "1.35" }], // 17px — empty-state titles
      },

      transitionDuration: {
        DEFAULT: "150ms",
        slow: "300ms",
      },

      zIndex: {
        header: "40",
        dropdown: "50",
        overlay: "60",
      },
    },
  },
  plugins: [],
};
