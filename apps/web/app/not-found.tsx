import { ButtonLink, Icon } from "@mpf/ui";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { SearchBox } from "@/components/SearchBox";
import { NAV_ITEMS } from "@/components/nav-items";

/**
 * 404s on a deals site are routine — offers expire and get delisted, and old links get
 * shared. The previous page was a heading and a single "Back to home" link, which threw
 * away every visitor who arrived on a dead offer URL. This gives them a way to keep
 * looking: a search field and the main sections.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-2xl px-5 py-16 text-center">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-pill bg-brand-50 text-brand-700"
        >
          <Icon name="search" size={28} />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          We couldn’t find that page
        </h1>
        <p className="mx-auto mt-2 max-w-md text-ui text-ink-600">
          The link may be broken, or the offer may have expired and been removed. Try a search —
          there’s a good chance a similar deal is live right now.
        </p>

        <div className="mx-auto mt-7 max-w-md text-left">
          <SearchBox placeholder="Search deals, stores or brands" />
        </div>

        <nav aria-label="Popular sections" className="mt-8">
          <ul className="flex flex-wrap justify-center gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <ButtonLink href={item.href} variant="outline" size="sm">
                  {item.label}
                </ButtonLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8">
          <ButtonLink href="/" variant="primary">
            Back to home
          </ButtonLink>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
