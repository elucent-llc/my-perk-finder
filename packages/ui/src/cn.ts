import clsx, { type ClassValue } from "clsx";

/** Tiny class-name combiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * The single focus indicator for the whole app. Apply to every interactive
 * element. brand-600 against white is 3.74:1, clearing WCAG 2.2 SC 1.4.11
 * (3:1 for non-text contrast); the previous brand-200 ring was 1.26:1, and
 * `outline-none` had removed the only compliant fallback.
 */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/** Same indicator, for containers that focus a child (search bars, cards). */
export const focusRingWithin =
  "focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-white";

export function formatPrice(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function discountPercent(regular: number, sale: number): number {
  if (regular <= 0) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}
