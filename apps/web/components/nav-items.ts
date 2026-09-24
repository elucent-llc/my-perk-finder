/**
 * Single source of truth for site navigation.
 *
 * The desktop header and the mobile drawer previously kept two separate
 * hardcoded arrays that had already drifted (mobile carried an extra "About"
 * entry, and neither offered Search below 640px).
 */
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Deals", href: "/deals" },
  { label: "Stores", href: "/stores" },
  { label: "Categories", href: "/categories" },
  { label: "Coupons", href: "/coupons" },
] as const;

export const FOOTER_LINKS: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
] as const;

/** True when `href` is the current section, so nav can set aria-current. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
