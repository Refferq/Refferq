import type { Metadata } from "next"
import { RefferqNav } from "@/components/refferq-nav"
import { RefferqHero } from "@/components/refferq-hero"
import { RefferqFeatures } from "@/components/refferq-features"
import { RefferqHowItWorks } from "@/components/refferq-how-it-works"
import { RefferqComparison } from "@/components/refferq-comparison"
import { RefferqPricing } from "@/components/refferq-pricing"
import { RefferqTestimonials } from "@/components/refferq-testimonials"
import { RefferqCTA } from "@/components/refferq-cta"
import { RefferqFooter } from "@/components/refferq-footer"
import Aurora from "@/components/Aurora"

export const metadata: Metadata = {
  title: "Refferq — Free Open-Source Affiliate Marketing Platform | Self-Hosted",
  description:
    "Launch and scale your affiliate program for free with Refferq. Self-hosted, open-source affiliate marketing platform with real-time tracking, flexible commissions, 38+ API endpoints, and automated payouts. Built with Next.js 15 & PostgreSQL.",
  alternates: { canonical: "https://refferq.com" },
  openGraph: {
    title: "Refferq — Free Open-Source Affiliate Marketing Platform",
    description:
      "Self-hosted affiliate marketing made simple. Track referrals, manage commissions, automate payouts — completely free and open source.",
    url: "https://refferq.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Refferq — Open-Source Affiliate Platform" }],
  },
  twitter: {
    title: "Refferq — Free Open-Source Affiliate Marketing Platform",
    description: "Self-hosted affiliate marketing made simple. Track referrals, manage commissions, automate payouts — completely free.",
    images: [{ url: "/og-image.png", alt: "Refferq — Open-Source Affiliate Platform" }],
  },
}

// ─── BreadcrumbList JSON-LD for Home ───────────────────────────
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://refferq.com",
    },
  ],
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="min-h-screen relative overflow-hidden">
        {/* Animated Aurora background */}
        <div className="fixed inset-0 w-full h-full">
          <Aurora
            colorStops={["#065f46", "#10b981", "#065f46"]}
            amplitude={0.8}
            blend={0.5}
            speed={0.6}
          />
        </div>

        <div className="relative z-10">
          <RefferqNav />
          <RefferqHero />
          <RefferqFeatures />
          <RefferqHowItWorks />
          <RefferqComparison />
          <RefferqPricing />
          <RefferqTestimonials />
          <RefferqCTA />
          <RefferqFooter />
        </div>
      </main>
    </div>
  )
}
