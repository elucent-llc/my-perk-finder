import { LegalPage } from "@/components/LegalPage";

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>For general inquiries, partnership requests, or to report an incorrect deal:</p>
      <ul className="ml-5 list-disc space-y-2">
        <li>
          Email:{" "}
          <a href="mailto:services@elucent.co" className="font-semibold text-brand-600 hover:underline">
            services@elucent.co
          </a>
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
