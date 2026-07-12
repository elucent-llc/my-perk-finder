/**
 * Infer a category name from offer text using keyword maps.
 * Pure function — no DB. Worker loads Category.mappingKeywords and passes them in.
 */

export type CategoryKeywordMap = Array<{ name: string; keywords: string[] }>;

/** Fallback keywords when DB categories are empty (also used in tests). */
export const DEFAULT_CATEGORY_KEYWORDS: CategoryKeywordMap = [
  {
    name: "Electronics",
    keywords: [
      "electronics",
      "laptop",
      "notebook",
      "phone",
      "smartphone",
      "tablet",
      "tv",
      "monitor",
      "camera",
      "drone",
      "charger",
      "usb",
      "ssd",
      "hard drive",
      "gpu",
      "pc ",
      "computer",
      "router",
      "smartwatch",
      "wearable",
    ],
  },
  {
    name: "Audio",
    keywords: [
      "headphones",
      "earbuds",
      "earbud",
      "speaker",
      "soundbar",
      "audio",
      "bluetooth speaker",
      "airpods",
      "headset",
    ],
  },
  {
    name: "Home & Kitchen",
    keywords: [
      "kitchen",
      "appliance",
      "cookware",
      "air fryer",
      "instant pot",
      "blender",
      "vacuum",
      "home ",
      "bedding",
      "mattress",
      "furniture",
      "coffee",
      "toaster",
    ],
  },
  {
    name: "Fashion",
    keywords: [
      "shoes",
      "apparel",
      "clothing",
      "fashion",
      "sneakers",
      "jacket",
      "dress",
      "jeans",
      "hoodie",
      "running shoe",
      "footwear",
      "handbag",
      "watch",
    ],
  },
  {
    name: "Beauty",
    keywords: ["beauty", "skincare", "makeup", "cosmetic", "serum", "moisturizer", "fragrance", "perfume"],
  },
  {
    name: "Sports & Outdoors",
    keywords: ["sports", "outdoor", "fitness", "gym", "hiking", "camping", "bike", "yoga", "running"],
  },
];

/**
 * Returns a category name when a keyword matches title/description/merchant, else null.
 * Keywords match as whole words/phrases (avoids "phone" matching inside "headphones").
 */
export function inferCategoryFromText(
  parts: { title?: string | null; description?: string | null; merchantName?: string | null },
  maps: CategoryKeywordMap = DEFAULT_CATEGORY_KEYWORDS
): string | null {
  const haystack = [parts.title, parts.description, parts.merchantName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!haystack.trim()) return null;

  for (const cat of maps) {
    // Longer keywords first so "running shoe" beats "running".
    const keywords = [...cat.keywords].sort((a, b) => b.length - a.length);
    for (const kw of keywords) {
      const needle = kw.toLowerCase().trim();
      if (!needle) continue;
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
      if (re.test(haystack)) return cat.name;
    }
  }
  return null;
}

/** Load active categories from DB and build a keyword map (falls back to defaults). */
export async function loadCategoryKeywordMap(
  findMany: () => Promise<Array<{ name: string; mappingKeywords: string[] }>>
): Promise<CategoryKeywordMap> {
  const rows = await findMany();
  const fromDb = rows
    .filter((r) => r.mappingKeywords.length > 0)
    .map((r) => ({ name: r.name, keywords: r.mappingKeywords }));
  return fromDb.length > 0 ? fromDb : DEFAULT_CATEGORY_KEYWORDS;
}
