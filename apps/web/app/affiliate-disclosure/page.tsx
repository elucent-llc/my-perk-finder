import { LegalPage } from "@/components/LegalPage";

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage title="Affiliate Disclosure">
      <p>Last updated: July 18, 2026</p>
      <p>
        MyPerkFinder (operated by Elucent) participates in affiliate marketing programs. This means we
        may earn a commission when you click a deal link and make a qualifying purchase on a
        retailer&apos;s website — at no additional cost to you.
      </p>
      <h2 className="text-lg font-bold text-slate-900">How affiliate links work</h2>
      <p>
        Deal buttons on MyPerkFinder route through our tracking link before sending you to the merchant.
        This helps us measure which offers are useful and keep the site running.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Editorial independence</h2>
      <p>
        Affiliate relationships do not change whether an offer is published. Offers with missing data or
        suspicious discounts are held for review and are not shown as active deals until they pass
        checks.
      </p>
      <h2 className="text-lg font-bold text-slate-900">FTC compliance</h2>
      <p>
        We disclose affiliate relationships clearly on deal pages and in the site footer, consistent with
        FTC guidelines on endorsements and testimonials.
      </p>
      <p>
        Questions:{" "}
        <a href="mailto:services@elucent.co" className="font-semibold text-brand-600 hover:underline">
          services@elucent.co
        </a>
        .
      </p>
    </LegalPage>
  );
}
