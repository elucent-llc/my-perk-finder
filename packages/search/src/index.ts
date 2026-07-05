import { MeiliSearch, type Index } from "meilisearch";

export const DEALS_INDEX = "deals";

let client: MeiliSearch | null = null;

/** Lazily-constructed Meilisearch client (reads env at call time). */
export function getSearchClient(): MeiliSearch {
  if (!client) {
    client = new MeiliSearch({
      host: process.env.MEILI_HOST ?? "http://localhost:7700",
      apiKey: process.env.MEILI_MASTER_KEY ?? "mpf_dev_master_key",
    });
  }
  return client;
}

/** Document shape stored in the `deals` index. */
export interface DealDocument {
  id: string;
  title: string;
  slug: string;
  merchantName: string;
  category: string;
  brand?: string | null;
  salePrice: number;
  regularPrice: number;
  discountPercent: number;
  couponCode?: string | null;
  status: string;
  expiryTimestamp?: number | null;
  clicksCount: number;
}

/** Ensure the deals index exists with sensible searchable/filterable attributes. */
export async function ensureDealsIndex(): Promise<Index<DealDocument>> {
  const c = getSearchClient();
  await c.createIndex(DEALS_INDEX, { primaryKey: "id" }).catch(() => undefined);
  const index = c.index<DealDocument>(DEALS_INDEX);
  await index.updateSettings({
    searchableAttributes: ["title", "merchantName", "brand", "category", "couponCode"],
    filterableAttributes: ["merchantName", "category", "brand", "status", "discountPercent", "salePrice"],
    sortableAttributes: ["salePrice", "discountPercent", "clicksCount", "expiryTimestamp"],
    rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
  });
  return index;
}

export async function indexDeals(docs: DealDocument[]): Promise<void> {
  const index = await ensureDealsIndex();
  await index.addDocuments(docs);
}

export async function searchDeals(
  query: string,
  opts: { limit?: number; offset?: number; filter?: string; sort?: string[] } = {}
) {
  const index = getSearchClient().index<DealDocument>(DEALS_INDEX);
  return index.search(query, {
    limit: opts.limit ?? 20,
    offset: opts.offset ?? 0,
    filter: opts.filter,
    sort: opts.sort,
  });
}
