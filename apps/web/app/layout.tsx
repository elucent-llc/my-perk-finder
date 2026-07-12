import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPerkFinder — Find better deals, rewards & hidden perks",
  description:
    "Discover product deals, coupons, cashback-style offers, and store promotions in one place.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }, { url: "/logo.png" }],
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
