import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>Last updated: July 5, 2026</p>
      <p>
        By using MyPerkFinder, you agree to these Terms. If you do not agree, please do not use the
        site.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Use of the service</h2>
      <p>
        MyPerkFinder provides deal listings and links to third-party merchants. We do not sell products
        directly. Prices, availability, and coupon eligibility are determined by merchants at checkout.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Accuracy disclaimer</h2>
      <p>
        We strive for accurate deal information but do not guarantee prices, discounts, or offer
        availability. Always verify details on the merchant&apos;s website before purchasing.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Affiliate relationships</h2>
      <p>
        Some links are affiliate links. See our{" "}
        <a href="/affiliate-disclosure" className="font-semibold text-brand-600 hover:underline">
          Affiliate Disclosure
        </a>
        .
      </p>
      <h2 className="text-lg font-bold text-slate-900">Limitation of liability</h2>
      <p>
        MyPerkFinder is provided &quot;as is.&quot; We are not liable for losses arising from use of
        third-party merchant sites or reliance on deal information.
      </p>
    </LegalPage>
  );
}
