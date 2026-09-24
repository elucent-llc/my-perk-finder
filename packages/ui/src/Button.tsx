import * as React from "react";
import { cn, focusRing } from "./cn.js";

type Variant = "primary" | "outline" | "ghost" | "secondary" | "success" | "warn" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * White text sits on -700/-800 steps only. brand-600 (3.74:1) and
 * savings/warn-600 failed AA for normal text at these sizes.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  outline: "bg-white border border-slate-300 text-ink-700 hover:bg-slate-50 hover:border-slate-400",
  ghost: "bg-transparent text-ink-600 hover:bg-slate-100",
  secondary: "bg-slate-100 text-ink-700 hover:bg-slate-200",
  success: "bg-savings-700 text-white hover:bg-savings-800",
  warn: "bg-warn-700 text-white hover:bg-warn-800",
  danger: "bg-danger-700 text-white hover:brightness-95",
};

/**
 * Minimum height 44px on md/lg to meet WCAG 2.5.8 target size. `sm` is
 * reserved for targets that sit inside a larger tappable surface.
 */
const SIZES: Record<Size, string> = {
  sm: "min-h-[36px] px-3 py-1.5 text-mini",
  md: "min-h-[44px] px-4 py-2.5 text-sm",
  lg: "min-h-[48px] px-6 py-3 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

export function buttonClasses(variant: Variant = "secondary", size: Size = "md", block?: boolean) {
  return cn(BASE, focusRing, VARIANTS[variant], SIZES[size], block && "w-full");
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  block,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses(variant, size, block), className)} {...props} />
  );
}

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

/**
 * A link that looks like a button. Use this instead of wrapping <Button> in an
 * <a> — that nests a button inside a link, which is invalid HTML and makes
 * assistive tech announce "link, button" with inconsistent Enter/Space
 * behaviour. If it navigates, it is an anchor.
 */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  block,
  className,
  ...props
}: ButtonLinkProps) {
  return <a className={cn(buttonClasses(variant, size, block), className)} {...props} />;
}
