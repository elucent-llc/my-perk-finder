/**
 * Shared Tailwind preset — MyPerkFinder design tokens.
 * Teal primary (deals/value), green savings, amber/red expiry, slate neutrals.
 * Consumed by apps/web, apps/admin and packages/ui.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary — teal: trust + value. Used for CTAs, links, active states.
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
        // Accent — warm amber/orange: discounts, urgency, "hot" signals (10% pop).
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        // Ink — deep navy neutrals: headings, footer, authoritative surfaces.
        ink: {
          700: "#1e293b",
          800: "#0f172a",
          900: "#0b1120",
        },
        savings: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warn: {
          50: "#fffbeb",
          100: "#fef3c7",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 4px 14px rgba(15,23,42,.08)",
        "card-sm": "0 1px 2px rgba(15,23,42,.06),0 1px 3px rgba(15,23,42,.04)",
        "card-lg": "0 12px 32px rgba(15,23,42,.12)",
      },
    },
  },
  plugins: [],
};
