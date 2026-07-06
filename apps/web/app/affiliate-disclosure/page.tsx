import { LegalPage } from "@/components/LegalPage";

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage title="Affiliate Disclosure">
      <p>Last updated: July 5, 2026</p>
      <p>
        MyPerkFinder participates in affiliate marketing programs. This means we may earn a commission
        when you click a deal link and make a qualifying purchase on a retailer&apos;s website — at no
        additional cost to you.
      </p>
      <h2 className="text-lg font-bold text-slate-900">How affiliate links work</h2>
      <p>
        Deal buttons on MyPerkFinder route through our tracking redirect (<code>/api/r/…</code>) before
        sending you to the merchant. This helps us measure which offers are useful and maintain the site.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Editorial independence</h2>
      <p>
        Affiliate relationships do not influence our review process. Offers with missing data, suspicious
        discounts, or low confidence are held for manual review and are not published as active deals.
      </p>
      <h2 className="text-lg font-bold text-slate-900">FTC compliance</h2>
      <p>
        We disclose affiliate relationships clearly on deal pages and in the site footer, consistent with
        FTC guidelines on endorsements and testimonials.
      </p>
    </LegalPage>
  );
}
