import Link from "next/link";
import { DealCard, DealGrid, StoreCard, Button, Chip, AffiliateDisclosure } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getDeals, getStores, toCard } from "@/lib/api";

export const dynamic = "force-dynamic";

const CATEGORIES = ["🔥 Electronics", "💻 Laptops", "📱 Phones", "🎧 Audio", "🏠 Home", "👟 Fashion", "🎮 Gaming"];

export default async function HomePage() {
  const deals = await getDeals();
  const stores = await getStores();
  const best = deals.slice(0, 4);
  const expiring = [...deals].sort(
    (a, b) => new Date(a.expiryDate ?? 0).getTime() - new Date(b.expiryDate ?? 0).getTime()
  ).slice(0, 4);

  return (
    <>
      <SiteHeader />

      <section className="bg-gradient-to-br from-brand-600 to-blue-600 px-6 py-12 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold">
          Find better deals, rewards, and hidden perks.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Discover product deals, coupons, cashback-style offers, and store promotions in one place.
        </p>
        <form
          action="/search"
          className="mx-auto mt-6 flex max-w-xl items-center gap-2.5 rounded-pill bg-white p-2 pl-5 shadow-card-lg"
        >
          <span className="text-slate-400">⌕</span>
          <input
            name="q"
            aria-label="Search deals"
            placeholder="Search laptops, phones, coupons, stores…"
            className="flex-1 border-0 bg-transparent text-[15px] text-slate-700 outline-none"
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/deals">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-slate-50">
              Browse Deals
            </Button>
          </Link>
          <Link href="/coupons">
            <Button size="lg" variant="ghost" className="border border-white/50 text-white">
              View Coupons
            </Button>
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="mb-3 text-base font-bold">Trending categories</h2>
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c, i) => (
            <Chip key={c} active={i === 0}>
              {c}
            </Chip>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">Today’s best deals</h2>
          <Link href="/deals" className="text-sm font-bold text-brand-600">
            View all →
          </Link>
        </div>
        <DealGrid className="mb-8">
          {best.map((d) => (
            <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
          ))}
        </DealGrid>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">⏳ Expiring soon</h2>
          <Link href="/deals?expiresSoon=true" className="text-sm font-bold text-brand-600">
            View all →
          </Link>
        </div>
        <DealGrid className="mb-8">
          {expiring.map((d) => (
            <DealCard key={d.id} deal={toCard(d)} href={`/deal/${d.slug}`} />
          ))}
        </DealGrid>

        <h2 className="mb-3 text-base font-bold">Popular stores</h2>
        <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5">
          {stores.map((s) => (
            <StoreCard key={s.slug} store={s} href={`/stores/${s.slug}`} />
          ))}
        </div>

        <AffiliateDisclosure />
      </main>

      <SiteFooter />
    </>
  );
}
