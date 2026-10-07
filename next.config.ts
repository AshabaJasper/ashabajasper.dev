import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // .dev is on the HSTS preload list already; this keeps browsers honest on every subdomain.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Files read with fs at runtime are not traced into the standalone output on
  // their own. The Dockerfile also copies them, this keeps `next start` honest.
  outputFileTracingIncludes: {
    "/*": ["./content/**/*", "./assets/fonts/**/*"],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Config headers match the incoming request, before the middleware
      // rewrite, so the admin host is recognised by its Host header.
      {
        source: "/(.*)",
        has: [{ type: "host", value: "admin\..+" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
