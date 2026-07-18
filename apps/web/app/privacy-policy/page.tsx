import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: July 18, 2026</p>
      <p>
        MyPerkFinder is operated by <strong>Elucent</strong> (&quot;we,&quot; &quot;us&quot;). This
        policy explains how we handle information when you use myperkfinder.com.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Information we collect</h2>
      <p>
        We collect information you provide directly (such as email if you subscribe to alerts) and
        technical data when you use our site, including browser type, pages visited, and anonymized
        click analytics on outbound deal links.
      </p>
      <h2 className="text-lg font-bold text-slate-900">How we use information</h2>
      <ul className="ml-5 list-disc space-y-2">
        <li>Operate and improve the website</li>
        <li>Measure deal performance and affiliate link clicks</li>
        <li>Send optional email alerts if you opt in</li>
        <li>Comply with legal obligations</li>
      </ul>
      <h2 className="text-lg font-bold text-slate-900">Cookies &amp; analytics</h2>
      <p>
        We may use cookies and similar technologies for essential site functionality and aggregated
        analytics. Third-party affiliate merchants may set their own cookies when you leave our site.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Data sharing</h2>
      <p>
        We do not sell personal information. We share limited data with service providers (hosting,
        email) and affiliate networks when you click outbound deal links.
      </p>
      <h2 className="text-lg font-bold text-slate-900">Your choices</h2>
      <p>
        You may request access, correction, or deletion of personal data by contacting{" "}
        <a href="mailto:services@elucent.co" className="font-semibold text-brand-600 hover:underline">
          services@elucent.co
        </a>
        .
      </p>
    </LegalPage>
  );
}
