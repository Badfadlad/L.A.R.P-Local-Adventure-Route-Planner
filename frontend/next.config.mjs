/** @type {import('next').NextConfig} */

// ---- Security headers (extra credit: cyber security) ----------------------
// Content-Security-Policy limits where scripts, styles, images and API calls
// can come from, so injected code can't load or send data anywhere else.
const isDev = process.env.NODE_ENV !== "production";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
// A relative API URL (e.g. "/api/v1" behind the Docker proxy) is the same origin.
const apiOrigin = /^https?:\/\//.test(apiUrl) ? new URL(apiUrl).origin : "";

const csp = [
  "default-src 'self'",
  // Next.js inlines small bootstrapping scripts; dev mode also needs eval for fast refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}${isDev ? " ws: wss:" : ""}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" }, // no clickjacking in iframes
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Smaller self-contained build for the Docker image.
  output: "standalone",
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
