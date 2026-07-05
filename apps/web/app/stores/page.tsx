import { StoreCard, Chip } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { MOCK_STORES } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function StoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <h1 className="mb-4 text-2xl font-extrabold">All Stores</h1>
        <div className="mb-5 flex flex-wrap gap-2">
          {["All", "Electronics", "Fashion", "Home", "Marketplace"].map((c, i) => (
            <Chip key={c} active={i === 0}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
          {MOCK_STORES.map((s) => (
            <StoreCard key={s.slug} store={s} href={`/stores/${s.slug}`} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
