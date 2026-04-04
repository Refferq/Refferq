import type { Metadata } from "next"
import { RefferqNav } from "@/components/refferq-nav"
import { RefferqFooter } from "@/components/refferq-footer"
import { RefferqCTA } from "@/components/refferq-cta"
import { FeaturesPageContent } from "@/components/refferq-features-page"
import Aurora from "@/components/Aurora"

export const metadata: Metadata = {
  title: "Features — Affiliate Management, Analytics, Tracking & Commissions",
  description:
    "Explore Refferq's complete feature set: affiliate lifecycle management, real-time analytics dashboards, geographic tracking, flexible commission rules, 38+ REST API endpoints, webhook events, automated email workflows, and one-click deployment with Docker or Vercel.",
  keywords: [
    "affiliate management features",
    "referral tracking dashboard",
    "real-time affiliate analytics",
    "commission management software",
    "webhook affiliate events",
    "affiliate API endpoints",
    "geographic referral tracking",
    "white-label affiliate platform",
  ],
  alternates: { canonical: "https://refferq.com/features" },
  openGraph: {
    title: "Refferq Features — Complete Affiliate Program Toolkit",
    description:
      "From affiliate onboarding to payouts — discover every feature that makes Refferq the most complete open-source affiliate marketing platform.",
    url: "https://refferq.com/features",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Refferq Features Overview" }],
  },
  twitter: {
    title: "Refferq Features — Complete Affiliate Program Toolkit",
    description: "Affiliate management, real-time tracking, flexible commissions, 38+ API endpoints, webhooks, and more — all open source.",
    images: [{ url: "/og-image.png", alt: "Refferq Features Overview" }],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://refferq.com" },
    { "@type": "ListItem", position: 2, name: "Features", item: "https://refferq.com/features" },
  ],
}

const featureListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Refferq Platform Features",
  description: "Complete feature list for the Refferq open-source affiliate marketing platform",
  numberOfItems: 6,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Affiliate Lifecycle Management", description: "Register, approve, suspend, and manage affiliates with custom referral codes and partner groups." },
    { "@type": "ListItem", position: 2, name: "Real-Time Analytics & Reporting", description: "Live dashboards, conversion funnels, geographic tracking, and CSV report exports." },
    { "@type": "ListItem", position: 3, name: "Enterprise-Grade Tracking", description: "JavaScript tracking snippet, cross-device attribution, and 12 webhook event types." },
    { "@type": "ListItem", position: 4, name: "Flexible Commission Rules", description: "Percentage or fixed-amount commissions, recurring payouts, and tiered performance bonuses." },
    { "@type": "ListItem", position: 5, name: "Automated Communication", description: "Email workflows for approvals, conversions, and payouts via Resend integration." },
    { "@type": "ListItem", position: 6, name: "Developer-Friendly Architecture", description: "Next.js 15, PostgreSQL, Prisma ORM, Tailwind CSS, and 38+ RESTful API endpoints." },
  ],
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featureListJsonLd) }}
      />
      <main className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 w-full h-full">
          <Aurora
            colorStops={["#065f46", "#10b981", "#065f46"]}
            amplitude={0.6}
            blend={0.4}
            speed={0.5}
          />
        </div>
        <div className="relative z-10">
          <RefferqNav />
          <FeaturesPageContent />
          <RefferqCTA />
          <RefferqFooter />
        </div>
      </main>
    </div>
  )
}
