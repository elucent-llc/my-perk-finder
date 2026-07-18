import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MyPerkFinder — Find better deals, coupons & perks",
    template: "%s · MyPerkFinder",
  },
  description:
    "Discover verified product deals, coupons, and store promotions in one place. Shop smarter with MyPerkFinder.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }, { url: "/logo.png" }],
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body className={sans.className}>{children}</body>
    </html>
  );
}
