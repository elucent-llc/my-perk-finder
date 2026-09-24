import { CouponCode } from "@mpf/ui";

/**
 * @deprecated Use `CouponCode` from `@mpf/ui` directly.
 *
 * This was one of two near-identical reveal implementations (the other lived inside
 * CouponCard). It revealed the code in place and stopped there: no copy, no confirmation,
 * no merchant tab, and the button stayed focusable with nothing left to do. Kept only as
 * a shim so any remaining import keeps compiling; it now renders the shared component.
 */
export function CouponReveal({ code, shopHref }: { code: string; shopHref?: string }) {
  return <CouponCode code={code} shopHref={shopHref} />;
}
