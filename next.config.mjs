/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ─── SEO: Trailing Slashes ────────────────────────────────────
  trailingSlash: false,

  // ─── SEO & Security Headers ───────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // SEO: Allow all AI and search crawlers
          { key: "X-Robots-Tag", value: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        ],
      },
      {
        // Cache static assets for 1 year
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|css|js)$",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache sitemap and robots for 1 day
        source: "/(sitemap\\.xml|robots\\.txt|llms\\.txt|llms-full\\.txt|humans\\.txt|manifest\\.json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=86400" },
        ],
      },
    ]
  },

  // ─── SEO Redirects ────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect common alternative URLs to canonical
      { source: "/home", destination: "/", permanent: true },
      { source: "/feature", destination: "/features", permanent: true },
      { source: "/price", destination: "/pricing", permanent: true },
      { source: "/documentation", destination: "/docs", permanent: true },
      { source: "/doc", destination: "/docs", permanent: true },
    ]
  },
}

export default nextConfig
