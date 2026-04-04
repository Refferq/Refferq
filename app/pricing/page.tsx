import type { Metadata } from "next"
import { RefferqNav } from "@/components/refferq-nav"
import { RefferqFooter } from "@/components/refferq-footer"
import { RefferqPricing } from "@/components/refferq-pricing"
import { RefferqComparison } from "@/components/refferq-comparison"
import { PricingFAQ } from "@/components/refferq-pricing-faq"
import { RefferqCTA } from "@/components/refferq-cta"
import Aurora from "@/components/Aurora"

export const metadata: Metadata = {
  title: "Pricing — Free Self-Hosted & Managed Cloud Plans",
  description:
    "Refferq is 100% free and open source for self-hosted deployments. Compare our $0/forever Self-Hosted plan with the upcoming $29/month Managed Cloud plan. No hidden fees, no transaction charges, no usage limits.",
  keywords: [
    "free affiliate software pricing",
    "open source affiliate platform cost",
    "self-hosted affiliate free",
    "affiliate marketing platform pricing",
    "managed affiliate hosting",
    "affiliate software comparison",
  ],
  alternates: { canonical: "https://refferq.com/pricing" },
  openGraph: {
    title: "Refferq Pricing — Free Forever, No Hidden Fees",
    description: "Self-hosted: $0/forever with unlimited affiliates. Managed Cloud: $29/month with dedicated support. Compare plans and save thousands.",
    url: "https://refferq.com/pricing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Refferq Pricing Plans" }],
  },
  twitter: {
    title: "Refferq Pricing — Free Forever, No Hidden Fees",
    description: "Self-hosted: $0/forever. Managed Cloud: $29/month. Full-featured affiliate marketing with zero transaction fees.",
    images: [{ url: "/og-image.png", alt: "Refferq Pricing Plans" }],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://refferq.com" },
    { "@type": "ListItem", position: 2, name: "Pricing", item: "https://refferq.com/pricing" },
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Refferq really free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Refferq is 100% free and open source under the MIT License. Self-host it on your own infrastructure at zero cost — there are no hidden fees, no per-transaction charges, and no usage limits. You get the complete platform with every feature included.",
      },
    },
    {
      "@type": "Question",
      name: "What are the hosting requirements?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Refferq requires Node.js 18 or later and PostgreSQL 12 or later. It runs efficiently on any VPS with as little as 1 GB of RAM, on Vercel's free tier, or as a Docker container. A typical setup takes approximately 15 minutes from start to finish.",
      },
    },
    {
      "@type": "Question",
      name: "Can I customize Refferq?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — extensively. You have full access to the source code, which means you can customize everything from the user interface and branding to commission rules and tracking logic. The stack — Next.js 15, TypeScript, and Tailwind CSS — is designed for rapid, maintainable customization.",
      },
    },
    {
      "@type": "Question",
      name: "How does the tracking work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Refferq includes a lightweight JavaScript tracking script that you embed on your website. It captures referral clicks through unique affiliate codes via /r/[code] routes or ?ref=CODE parameters, records conversions through the API, and automatically attributes commissions to the correct affiliate.",
      },
    },
    {
      "@type": "Question",
      name: "What kind of support is available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The self-hosted edition includes community support through GitHub Discussions and Issues, along with comprehensive documentation covering setup, API reference, and deployment guides. The upcoming Managed Cloud plan will include dedicated email support with guaranteed response times.",
      },
    },
    {
      "@type": "Question",
      name: "Can I migrate from another platform?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Refferq's REST API makes it straightforward to import affiliate records, referral history, and commission data from other platforms. Our documentation includes step-by-step migration guides for popular affiliate management tools.",
      },
    },
  ],
}

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Refferq Affiliate Marketing Platform",
  description: "Free, open-source, self-hosted affiliate marketing platform with unlimited affiliates, real-time tracking, and flexible commissions.",
  brand: { "@type": "Brand", name: "Refferq" },
  image: "https://refferq.com/og-image.png",
  offers: [
    {
      "@type": "Offer",
      name: "Self-Hosted",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Full-featured affiliate management on your own infrastructure. No limits, no strings attached.",
      url: "https://github.com/Refferq/Refferq",
    },
    {
      "@type": "Offer",
      name: "Managed Cloud",
      price: "29",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
      description: "Fully managed hosting with automatic updates, backups, and dedicated support.",
      url: "https://refferq.com/pricing",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
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
          {/* Hero */}
          <section className="pt-32 pb-8 text-center px-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              100% Free & Open Source
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Predictable pricing,{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                no surprises
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
              Get started at zero cost with our self-hosted plan, or let us handle the infrastructure with Managed Cloud.
            </p>
          </section>
          <RefferqPricing />
          <RefferqComparison />
          <PricingFAQ />
          <RefferqCTA />
          <RefferqFooter />
        </div>
      </main>
    </div>
  )
}
