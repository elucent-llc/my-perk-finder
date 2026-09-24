import * as React from "react";

export type IconName =
  | "search"
  | "tag"
  | "check"
  | "clock"
  | "info"
  | "coupon"
  | "fire"
  | "mail"
  | "arrow-right"
  | "external"
  | "bolt"
  | "store"
  | "shield"
  | "arrow-left"
  | "close"
  | "heart"
  | "filter"
  | "chevron-down"
  | "copy"
  | "share"
  | "menu";

const PATHS: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12l9-9 9 9-9 9-9-9z" fill="none" />
      <path d="M11.5 3.5l9 9-8 8-9-9v-8z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  coupon: (
    <>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
      <path d="M15 6v12" strokeDasharray="2 2" />
    </>
  ),
  fire: (
    <path
      d="M12 3s5 4 5 9a5 5 0 01-10 0c0-1.5.5-2.5 1-3 0 1.5 1 2 1.5 2 0-2 1-4 2.5-8z"
      strokeLinejoin="round"
    />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m-6-6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  external: (
    <>
      <path d="M14 4h6v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l-9 9" strokeLinecap="round" />
      <path d="M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" strokeLinecap="round" />
    </>
  ),
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" strokeLinejoin="round" />,
  store: (
    <>
      <path d="M4 9l1-4h14l1 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" />
      <path d="M5 9v10h14V9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <path
      d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
      strokeLinejoin="round"
    />
  ),
  "arrow-left": <path d="M20 12H5m6-6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />,
  close: <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />,
  /* Pass fill="currentColor" for the saved/active state. */
  heart: (
    <path
      d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0112 7a4.5 4.5 0 017 3.5c0 5.15-7 9.5-7 9.5z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  filter: (
    <>
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 5.5A1.5 1.5 0 0013.5 4H6a2 2 0 00-2 2v7.5A1.5 1.5 0 005.5 15" strokeLinecap="round" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M15.8 6.3l-7.6 4.4m0 2.6l7.6 4.4" strokeLinecap="round" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />,
};

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden
      className={className}
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
