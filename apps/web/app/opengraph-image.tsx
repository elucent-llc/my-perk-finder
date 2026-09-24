import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1120 0%, #115e59 55%, #0d9488 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, color: "#5eead4" }}>
          MYPERKFINDER
        </div>
        <div style={{ marginTop: 24, fontSize: 74, fontWeight: 800, lineHeight: 1.05, maxWidth: 920 }}>
          Better deals, coupons &amp; perks — in one place.
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "rgba(255,255,255,0.85)", maxWidth: 900 }}>
          Verified offers from popular stores. Find the savings, then shop at the merchant.
        </div>
      </div>
    ),
    { ...size }
  );
}
