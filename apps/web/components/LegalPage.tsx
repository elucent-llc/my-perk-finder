import * as React from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PageHeader } from "@/components/PageHeader";

/**
 * Shared shell for /about, /contact, /terms, /privacy-policy and /affiliate-disclosure.
 *
 * The content column used `prose prose-slate`, but `@tailwindcss/typography` is not in the
 * plugin list for either app — those classes generated nothing, which is why every legal
 * page had to hand-style each `<h2>` with the same `text-lg font-bold text-ink-800`, each
 * list with the same `ml-5 list-disc`, and each link with `text-brand-600` (3.9:1 on white,
 * below the 4.5:1 required by SC 1.4.3). Styling descendants here fixes all five pages at
 * once and makes the per-page classNames redundant rather than load-bearing.
 *
 * It also gains the `id="main"` target the layout's skip link points at, a real breadcrumb
 * trail, and the shared h1 treatment so these pages stop looking like a different site.
 */
export function LegalPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-5 py-10">
        <PageHeader
          breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
          title={title}
          description={description}
        />
        <div
          className={[
            "max-w-none space-y-4 text-ui leading-relaxed text-ink-700",
            // Headings: h2 for sections, h3 for sub-points. Extra top margin gives the
            // sections a scannable rhythm that uniform space-y-4 did not.
            "[&_h2]:mt-8 [&_h2]:text-subhead [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-ink-900",
            "[&_h3]:mt-6 [&_h3]:text-ui [&_h3]:font-bold [&_h3]:text-ink-800",
            // Lists: indent + markers, and a little breathing room between items.
            "[&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2",
            "[&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2",
            "[&_li]:pl-1",
            // Links: brand-700 is the lightest AA-safe step, and `underline` means the link
            // is not signalled by colour alone (SC 1.4.1).
            "[&_a]:rounded-control [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_a:hover]:text-brand-800",
            "[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-brand-600 [&_a:focus-visible]:ring-offset-2",
            "[&_strong]:font-bold [&_strong]:text-ink-900",
            // Long policy prose reads better at a measure of ~70 characters.
            "[&_p]:max-w-prose",
          ].join(" ")}
        >
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
