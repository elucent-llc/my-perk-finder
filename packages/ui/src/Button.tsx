import * as React from "react";
import { cn } from "./cn.js";

type Variant = "primary" | "outline" | "ghost" | "secondary" | "success" | "warn" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-[0_4px_12px_rgba(79,70,229,.28)] hover:bg-brand-700",
  outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  success: "bg-savings-600 text-white hover:brightness-95",
  warn: "bg-warn-600 text-white hover:brightness-95",
  danger: "bg-danger-600 text-white hover:brightness-95",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "secondary",
  size = "md",
  block,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className
      )}
      {...props}
    />
  );
}
