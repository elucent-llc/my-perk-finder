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

export function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
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
