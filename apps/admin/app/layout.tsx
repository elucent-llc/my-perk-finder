import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyPerkFinder — Admin",
  description: "Operations dashboard for MyPerkFinder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
