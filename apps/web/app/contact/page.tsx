import { LegalPage } from "@/components/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us · MyPerkFinder",
  description:
    "Contact MyPerkFinder (operated by Elucent) for inquiries, partnerships, or to report an incorrect or expired deal.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us" description="Last updated: July 18, 2026">
      <p>
        MyPerkFinder is operated by Elucent. For general inquiries, partnership requests, or to report
        an incorrect deal:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a href="mailto:services@elucent.co">services@elucent.co</a>
        </li>
        <li>Business hours: Monday–Friday, 9:00 AM – 5:00 PM ET</li>
      </ul>
      <p>
        We aim to respond within two business days. When reporting an expired or incorrect offer, please
        include the deal URL and merchant name.
      </p>
    </LegalPage>
  );
}
