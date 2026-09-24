/**
 * Which remote hosts next/image may optimise.
 *
 * Deal imagery arrives from affiliate feeds (AWIN, CJ, Walmart), so the
 * hostnames are merchant CDNs we do not control and cannot fully enumerate —
 * an unconfigured host makes next/image throw and takes the page down, which is
 * worse than the alternative. The default therefore allows any HTTPS host.
 *
 * Note the trade-off: a wildcard turns /_next/image into an open image proxy.
 * It is deliberately narrowed by the settings below — SVG is refused, and only
 * the handful of widths in deviceSizes/imageSizes can ever be requested. Set
 * IMAGE_REMOTE_HOSTS (comma-separated hostnames, `*.` wildcards allowed) once
 * the real set of merchant CDNs is known, and this tightens to an allowlist.
 */
const configuredHosts = (process.env.IMAGE_REMOTE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const remotePatterns =
  configuredHosts.length > 0
    ? configuredHosts.map((hostname) => ({ protocol: "https", hostname }))
    : [{ protocol: "https", hostname: "**" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Smaller deploy image and faster cold starts on Railway/nixpacks.
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: ["@mpf/ui", "@mpf/types", "@mpf/db", "@mpf/env"],
  serverExternalPackages: ["@prisma/client"],

  experimental: {
    // @mpf/ui is a flat barrel that re-exports client components, so pages
    // importing one server-safe helper were pulling the whole module graph.
    optimizePackageImports: ["@mpf/ui"],
  },

  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    // Deal cards render at ~210-280px, hero media at up to ~640px. Keeping
    // this list short also limits the proxy surface above.
    deviceSizes: [320, 420, 640, 828, 1080, 1200, 1920],
    imageSizes: [48, 64, 96, 128, 210, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24h — merchant imagery is stable
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },

  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },

  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : []),
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Fingerprinted build output — safe to cache forever.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Static brand assets referenced from metadata on every page.
        source: "/:file(logo.svg|favicon.ico|robots.txt)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
