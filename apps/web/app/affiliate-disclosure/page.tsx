import { LegalPage } from "@/components/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Affiliate Disclosure · MyPerkFinder",
  description:
    "How MyPerkFinder uses affiliate links, our editorial independence, and FTC compliance.",
  path: "/affiliate-disclosure",
});

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage title="Affiliate Disclosure" description="Last updated: July 18, 2026">
      <p>
        MyPerkFinder (operated by Elucent) participates in affiliate marketing programs. This means we
        may earn a commission when you click a deal link and make a qualifying purchase on a
        retailer&apos;s website — at no additional cost to you.
      </p>
      <h2>How affiliate links work</h2>
      <p>
        Deal buttons on MyPerkFinder route through our tracking link before sending you to the merchant.
        This helps us measure which offers are useful and keep the site running.
      </p>
      <h2>Editorial independence</h2>
      <p>
        Affiliate relationships do not change whether an offer is published. Offers with missing data or
        suspicious discounts are held for review and are not shown as active deals until they pass
        checks.
      </p>
      <h2>FTC compliance</h2>
      <p>
        We disclose affiliate relationships clearly on deal pages and in the site footer, consistent with
        FTC guidelines on endorsements and testimonials.
      </p>
      <p>
        Questions:{" "}
        <a href="mailto:services@elucent.co">services@elucent.co</a>
        .
      </p>
    </LegalPage>
  );
}
