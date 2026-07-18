import { LegalPage } from "@/components/LegalPage";

export default function AboutPage() {
  return (
    <LegalPage title="About MyPerkFinder">
      <p>
        MyPerkFinder helps shoppers discover deals, coupon codes, and store promotions from trusted
        retailers — in one clean place.
      </p>
      <p>
        We aggregate offers from affiliate partners, check them for missing or suspicious details, and
        publish only active listings. Prices and availability always finalize on the merchant&apos;s
        site.
      </p>
      <p>
        MyPerkFinder is operated by <strong>Elucent</strong>. We may earn a commission when you purchase
        through links on our site. See our{" "}
        <a href="/affiliate-disclosure" className="font-semibold text-brand-600 hover:underline">
          Affiliate Disclosure
        </a>{" "}
        for details.
      </p>
      <p>
        Questions? Email{" "}
        <a href="mailto:services@elucent.co" className="font-semibold text-brand-600 hover:underline">
          services@elucent.co
        </a>
        .
      </p>
    </LegalPage>
  );
}
