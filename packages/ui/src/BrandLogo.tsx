import { useId } from "react";
import { cn } from "./cn.js";

export interface BrandLogoProps {
  className?: string;
  /** Show wordmark next to the mark. Default true. */
  withWordmark?: boolean;
  /** Mark size in px. Default 32. */
  size?: number;
  title?: string;
}

/**
 * MyPerkFinder brand mark — verified price-tag on teal→emerald tile.
 */
export function BrandLogo({
  className,
  withWordmark = true,
  size = 32,
  title = "MyPerkFinder",
}: BrandLogoProps) {
  const gradId = `mpf-${useId().replace(/:/g, "")}`;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={withWordmark ? true : undefined}
        role={withWordmark ? undefined : "img"}
        aria-label={withWordmark ? undefined : title}
      >
        <defs>
          <linearGradient id={gradId} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill={`url(#${gradId})`} />
        <path
          d="M18.5 28.2c0-2.1 1.7-3.8 3.8-3.8h13.4c.9 0 1.8.4 2.4 1l9.2 9.2c1.3 1.3 1.3 3.4 0 4.7l-9.1 9.1c-1.3 1.3-3.4 1.3-4.7 0l-9.2-9.2c-.6-.6-1-1.5-1-2.4V28.2z"
          fill="white"
        />
        <circle cx="25.2" cy="28.8" r="2.4" fill="#0d9488" />
        <path
          d="M30.2 38.4l3.4 3.4 7.2-8.2"
          stroke="#0d9488"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark ? (
        <span className="text-base font-extrabold tracking-tight text-slate-900">
          My<span className="text-brand-600">Perk</span>Finder
        </span>
      ) : null}
    </span>
  );
}
