import type { Metadata } from "next"
import { RefferqNav } from "@/components/refferq-nav"
import { RefferqFooter } from "@/components/refferq-footer"
import { DocsPageContent } from "@/components/refferq-docs-content"
import Aurora from "@/components/Aurora"

export const metadata: Metadata = {
  title: "Documentation — Setup, API Reference, Deployment & Guides",
  description:
    "Complete Refferq documentation: quick-start guide, installation instructions, environment configuration, affiliate management, tracking setup, commission rules, 38+ API endpoints, webhook events, and deployment guides for Vercel, Docker, and VPS.",
  keywords: [
    "Refferq documentation",
    "affiliate platform setup guide",
    "self-hosted affiliate installation",
    "affiliate API reference",
    "webhook events documentation",
    "Docker affiliate deployment",
    "Vercel affiliate setup",
    "affiliate tracking setup",
    "Prisma PostgreSQL affiliate",
  ],
  alternates: { canonical: "https://refferq.com/docs" },
  openGraph: {
    title: "Refferq Documentation — Setup, API & Deployment Guides",
    description: "Everything you need to install, configure, and deploy Refferq. Covers API reference, webhook events, tracking setup, and more.",
    url: "https://refferq.com/docs",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Refferq Documentation" }],
  },
  twitter: {
    title: "Refferq Documentation — Setup, API & Deployment Guides",
    description: "Complete guide to installing, configuring, and deploying the Refferq affiliate marketing platform.",
    images: [{ url: "/og-image.png", alt: "Refferq Documentation" }],
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://refferq.com" },
    { "@type": "ListItem", position: 2, name: "Documentation", item: "https://refferq.com/docs" },
  ],
}

const techArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Refferq Documentation — Complete Setup & API Reference Guide",
  description: "Comprehensive documentation for the Refferq open-source affiliate marketing platform including installation, configuration, API reference, and deployment.",
  author: { "@type": "Organization", name: "Refferq", url: "https://refferq.com" },
  publisher: {
    "@type": "Organization",
    name: "Refferq",
    logo: { "@type": "ImageObject", url: "https://refferq.com/icon-512.png" },
  },
  datePublished: "2025-01-15",
  dateModified: "2026-02-18",
  mainEntityOfPage: "https://refferq.com/docs",
  image: "https://refferq.com/og-image.png",
  about: {
    "@type": "SoftwareApplication",
    name: "Refferq",
    applicationCategory: "BusinessApplication",
  },
  proficiencyLevel: "Beginner",
  dependencies: "Node.js 18+, PostgreSQL 12+",
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <main className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 w-full h-full">
          <Aurora
            colorStops={["#065f46", "#10b981", "#065f46"]}
            amplitude={0.4}
            blend={0.3}
            speed={0.4}
          />
        </div>
        <div className="relative z-10">
          <RefferqNav />
          <DocsPageContent />
          <RefferqFooter />
        </div>
      </main>
    </div>
  )
}
