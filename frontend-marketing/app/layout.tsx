import type React from "react"
import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import "./globals.css"
import { PageTransition } from "@/components/page-transition"
import { NavigationTransition } from "@/components/navigation-transition"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const SITE_URL = "https://refferq.com"
const SITE_NAME = "Refferq"
const DEFAULT_TITLE = "Refferq — Free Open-Source Affiliate Marketing Platform | Self-Hosted"
const DEFAULT_DESCRIPTION =
  "Refferq is a free, self-hosted, open-source affiliate marketing platform. Track referrals, manage commissions, automate payouts, and scale your partner program — built with Next.js 15, PostgreSQL & Prisma. Deploy in minutes with Docker or Vercel."
const DEFAULT_KEYWORDS = [
  "affiliate marketing platform",
  "open source affiliate software",
  "self-hosted affiliate program",
  "referral tracking software",
  "commission management tool",
  "affiliate program management",
  "free affiliate software",
  "affiliate dashboard",
  "referral program software",
  "partner program platform",
  "Next.js affiliate platform",
  "PostgreSQL affiliate tracking",
  "Docker affiliate software",
  "white-label affiliate solution",
  "SaaS affiliate program",
  "affiliate payout management",
  "real-time referral analytics",
  "webhook affiliate events",
  "REST API affiliate platform",
  "MIT license affiliate tool",
]

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  // ─── Core Meta ───────────────────────────────────────────────
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: "Refferq Team", url: SITE_URL }],
  creator: "Refferq",
  publisher: "Refferq",

  // ─── Canonical & Alternates ──────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ─── App Manifest ────────────────────────────────────────────
  manifest: "/manifest.json",

  // ─── Open Graph (Facebook, LinkedIn, Discord, Slack) ─────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Refferq — Free Open-Source Affiliate Marketing Platform",
        type: "image/png",
      },
      {
        url: "/og-image-square.png",
        width: 600,
        height: 600,
        alt: "Refferq Logo",
        type: "image/png",
      },
    ],
  },

  // ─── Twitter / X Card ────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    site: "@refferq",
    creator: "@refferq",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: {
      url: "/og-image.png",
      alt: "Refferq — Free Open-Source Affiliate Marketing Platform",
    },
  },

  // ─── Icons & Favicons ────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // ─── Robots ──────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ─── Verification ────────────────────────────────────────────
  // Uncomment and fill these when you add verification codes:
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  //   yahoo: "your-yahoo-verification-code",
  // },

  // ─── App Links ───────────────────────────────────────────────
  category: "technology",
  classification: "Affiliate Marketing Software",
}

// ─── Organization JSON-LD ──────────────────────────────────────
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESCRIPTION,
  foundingDate: "2025",
  sameAs: [
    "https://github.com/Refferq/Refferq",
    "https://twitter.com/refferq",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "technical support",
    url: "https://github.com/Refferq/Refferq/discussions",
  },
}

// ─── Website JSON-LD (for Sitelinks Search Box in SERPs) ───────
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
}

// ─── SoftwareApplication JSON-LD (for rich results) ────────────
const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Affiliate Marketing",
  operatingSystem: "Cross-platform (Web)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    description: "Free and open-source under the MIT License",
  },
  softwareVersion: "1.1.0",
  license: "https://opensource.org/licenses/MIT",
  programmingLanguage: ["TypeScript", "JavaScript"],
  runtimePlatform: "Node.js",
  downloadUrl: "https://github.com/Refferq/Refferq",
  screenshot: `${SITE_URL}/og-image.png`,
  featureList: [
    "Unlimited affiliates",
    "Real-time referral tracking",
    "Flexible commission rules",
    "Automated email notifications",
    "38+ REST API endpoints",
    "12 webhook event types",
    "PostgreSQL with Prisma ORM",
    "Self-hosted deployment",
    "Docker and Vercel support",
    "White-label branding",
    "Geographic analytics",
    "CSV report exports",
  ],
  author: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" dir="ltr">
      <head>
        {/* ─── Structured Data (JSON-LD) ─────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />

        {/* ─── Preconnect for Performance ────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* ─── Additional SEO Meta ───────────────────────────────── */}
        <meta name="application-name" content="Refferq" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Refferq" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#10b981" />
      </head>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <Suspense fallback={null}>
          <NavigationTransition />
          <PageTransition>{children}</PageTransition>
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  )
}
