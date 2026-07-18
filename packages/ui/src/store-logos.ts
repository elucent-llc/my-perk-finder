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

const AVATAR_PALETTES = [
  "from-teal-500 to-emerald-700",
  "from-cyan-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-700",
  "from-rose-500 to-orange-600",
  "from-lime-500 to-green-700",
] as const;

/** Stable gradient classes for letter avatars (no logo). */
export function merchantAvatarGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]!;
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
