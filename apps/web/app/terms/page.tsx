import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service · MyPerkFinder",
  description:
    "The terms that govern your use of MyPerkFinder, including affiliate links and third-party merchant offers.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" description="Last updated: July 18, 2026">
      <p>
        By using MyPerkFinder (operated by Elucent), you agree to these Terms. If you do not agree,
        please do not use the site.
      </p>
      <h2>Use of the service</h2>
      <p>
        MyPerkFinder provides deal listings and links to third-party merchants. We do not sell products
        directly. Prices, availability, and coupon eligibility are determined by merchants at checkout.
      </p>
      <h2>Accuracy disclaimer</h2>
      <p>
        We strive for accurate deal information but do not guarantee prices, discounts, or offer
        availability. Always verify details on the merchant&apos;s website before purchasing.
      </p>
      <h2>Affiliate relationships</h2>
      <p>
        Some links are affiliate links. See our{" "}
        <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
        .
      </p>
      <h2>Limitation of liability</h2>
      <p>
        MyPerkFinder is provided &quot;as is.&quot; We are not liable for losses arising from use of
        third-party merchant sites or reliance on deal information.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href="mailto:services@elucent.co">services@elucent.co</a>
        .
      </p>
    </LegalPage>
  );
}
