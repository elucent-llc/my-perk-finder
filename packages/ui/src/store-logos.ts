/** Popular merchant slug → Simple Icons id. Aliases cover common slug variants. */
const POPULAR_STORE_ICONS: Record<string, string> = {
  amazon: "amazon",
  "best-buy": "bestbuy",
  bestbuy: "bestbuy",
  walmart: "walmart",
  target: "target",
  nike: "nike",
  dell: "dell",
  ebay: "ebay",
  apple: "apple",
  samsung: "samsung",
  sony: "sony",
  adidas: "adidas",
  microsoft: "microsoft",
  hp: "hp",
  lenovo: "lenovo",
  costco: "costco",
  macys: "macys",
  "macy-s": "macys",
  nordstrom: "nordstrom",
  homedepot: "homedepot",
  "home-depot": "homedepot",
  lowes: "lowes",
  "lowe-s": "lowes",
  sephora: "sephora",
  gap: "gap",
  puma: "puma",
  reebok: "reebok",
  underarmour: "underarmour",
  "under-armour": "underarmour",
  newbalance: "newbalance",
  "new-balance": "newbalance",
};

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Initials from letters only — avoids "O(" from names like "Oedro (US)". */
export function merchantInitials(name: string): string {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    const letters = name.replace(/[^a-zA-Z0-9]/g, "");
    return (letters.slice(0, 2) || "?").toUpperCase();
  }
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Classes for letter avatars when a store has no logo.
 *
 * This used to hash the store name into one of six saturated gradients
 * (teal/cyan/amber/sky/rose/lime). Because a large share of imported merchants
 * have no logo, the store grids rendered as a random rainbow that read as
 * decoration rather than information, and white text on the -500 steps was as
 * low as 1.90:1. One quiet branded surface instead: the merchant's own logos
 * and product photography are the only colour that should vary in a grid.
 *
 * `seed` is retained so callers need no changes and a per-store treatment can
 * be reintroduced later if it ever earns its place.
 */
export function merchantAvatarGradient(_seed?: string): string {
  return "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-100";
}

/**
 * Resolve a store/merchant logo URL.
 * Known popular stores use brand icons; otherwise falls back to a custom logoUrl.
 */
export function resolveStoreLogoUrl(
  slugOrName: string,
  existingLogoUrl?: string | null
): string | null {
  const icon = POPULAR_STORE_ICONS[slugifyKey(slugOrName)];
  if (icon) return `https://cdn.simpleicons.org/${icon}`;
  return existingLogoUrl?.trim() || null;
}

/**
 * Whether a logo URL must bypass the Next image optimizer.
 *
 * Every entry in POPULAR_STORE_ICONS resolves to cdn.simpleicons.org, which serves SVG.
 * `next.config.mjs` sets `dangerouslyAllowSVG: false` — a deliberate choice, since the
 * optimizer would otherwise proxy arbitrary remote SVG (a scriptable format) from our own
 * origin — so `/_next/image` answers those requests with HTTP 400 and the browser paints a
 * broken-image glyph. That is every logo on /stores, in the similar-stores rail, on
 * image-less deal cards and beside the store `<h1>`.
 *
 * `unoptimized` renders the URL directly and never touches `/_next/image`, so the SVG policy
 * stops applying without being weakened. Nothing is lost: these files are ~1KB of vector and
 * resizing them is the browser's job anyway.
 *
 * This is deliberately not a blanket `unoptimized` on the logo slots. A merchant `logoUrl`
 * from the feed is usually a raster of unknown size, and those should still be resized and
 * served as AVIF/WebP for a 36px avatar.
 */
export function logoNeedsUnoptimized(url: string): boolean {
  return url.startsWith("https://cdn.simpleicons.org/") || /\.svg(\?|#|$)/i.test(url);
}
