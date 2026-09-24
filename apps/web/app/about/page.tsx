import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About MyPerkFinder",
  description:
    "MyPerkFinder helps shoppers discover verified deals, coupon codes, and store promotions from trusted retailers — in one clean place.",
  path: "/about",
});

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
        <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>{" "}
        for details.
      </p>
      <p>
        Questions? Email{" "}
        <a href="mailto:services@elucent.co">services@elucent.co</a>
        .
      </p>
    </LegalPage>
  );
}
