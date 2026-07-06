import { LegalPage } from "@/components/LegalPage";

export default function AboutPage() {
  return (
    <LegalPage title="About MyPerkFinder">
      <p>
        MyPerkFinder helps shoppers discover verified deals, coupon codes, and store promotions from
        trusted retailers. We aggregate affiliate offers, validate pricing details, and surface savings
        opportunities in one place.
      </p>
      <p>
        Our editorial team reviews imported offers for accuracy before publication. Offers marked
        &quot;needs review&quot; are not shown publicly until approved.
      </p>
      <p>
        MyPerkFinder may earn commissions when you purchase through links on our site. See our{" "}
        <a href="/affiliate-disclosure" className="font-semibold text-brand-600 hover:underline">
          Affiliate Disclosure
        </a>{" "}
        for details.
      </p>
    </LegalPage>
  );
}
