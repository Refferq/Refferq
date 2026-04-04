"use client"

import {
  Users,
  Activity,
  Percent,
  Mail,
  Code2,
  Server,
  BarChart3,
  Globe,
  Webhook,
  Shield,
  Zap,
  Database,
  KeyRound,
  Megaphone,
  HelpCircle,
  Palette,
  Trophy,
  TrendingUp,
  Calendar,
  Download,
  MapPin,
  Filter,
  Repeat,
  Award,
  CreditCard,
} from "lucide-react"
import { useRef, useState, useEffect } from "react"

const featureSections = [
  {
    badge: "Affiliate Management",
    badgeColor: "emerald",
    title: "Complete affiliate lifecycle management",
    features: [
      { icon: Users, title: "User Management", description: "Register, approve, suspend, and manage affiliates with granular status workflows and administrative controls." },
      { icon: TrendingUp, title: "Performance Tracking", description: "Monitor each affiliate's clicks, conversions, and revenue contributions through real-time dashboards." },
      { icon: KeyRound, title: "Custom Referral Codes", description: "Generate codes automatically or allow custom codes. Track attribution via dedicated /r/[code] routes or ?ref=CODE parameters." },
    ],
  },
  {
    badge: "Analytics & Reporting",
    badgeNew: true,
    badgeColor: "teal",
    title: "Data-driven insights to accelerate growth",
    features: [
      { icon: BarChart3, title: "Real-Time Dashboard", description: "View live metrics, conversion rates, and revenue performance at a glance." },
      { icon: Trophy, title: "Top Performers Leaderboard", description: "Automatically rank and highlight your highest-performing affiliates by key metrics." },
      { icon: MapPin, title: "Geographic Analytics", description: "Understand referral sources by region with built-in IP-based geographic data." },
      { icon: Filter, title: "Conversion Funnel Analysis", description: "Visualize the complete customer journey from initial click to final conversion." },
      { icon: Calendar, title: "Custom Date Ranges", description: "Filter all reports and dashboards by flexible date ranges for targeted analysis." },
      { icon: Download, title: "Export Reports", description: "Download comprehensive reports as CSV files for external analysis and record-keeping." },
    ],
  },
  {
    badge: "Advanced Tracking",
    badgeColor: "cyan",
    title: "Enterprise-grade tracking and attribution",
    features: [
      { icon: Code2, title: "JavaScript Tracking Snippet", description: "A lightweight, embeddable script for seamless integration with any website or web application." },
      { icon: KeyRound, title: "API Key Management", description: "Generate and manage secure API keys for programmatic access and third-party integrations." },
      { icon: Activity, title: "Real-Time Event Stream", description: "Live click and conversion data with instant updates reflected across all dashboards." },
      { icon: Globe, title: "Geographic Attribution", description: "IP-based geographic tracking enables detailed referral source analysis by region." },
      { icon: Webhook, title: "Webhook Event System", description: "Subscribe to 12 event types with HMAC-SHA256 security, automatic retries, and delivery tracking." },
      { icon: Shield, title: "Cross-Device Attribution", description: "Track referrals across multiple devices with persistent cookie-based attribution logic." },
    ],
  },
  {
    badge: "Flexible Commissions",
    badgeColor: "emerald",
    title: "Commission structures tailored to your business",
    features: [
      { icon: Percent, title: "Custom Commission Rules", description: "Configure percentage-based or fixed-amount commissions with per-group granularity." },
      { icon: Repeat, title: "Recurring Commissions", description: "Support subscription and recurring revenue models with automated ongoing payouts." },
      { icon: Award, title: "Performance Bonuses", description: "Motivate top performers with configurable tiered bonus structures and incentives." },
      { icon: CreditCard, title: "Balance Management", description: "Track affiliate balances with a complete, auditable transaction history." },
    ],
  },
  {
    badge: "Communication",
    badgeColor: "teal",
    title: "Keep your affiliate network engaged and informed",
    features: [
      { icon: Mail, title: "Automated Email Workflows", description: "Welcome emails, approval notifications, conversion alerts, and payout confirmations — all powered by Resend." },
      { icon: Megaphone, title: "Network Announcements", description: "Broadcast updates, promotions, and program changes to your entire affiliate network." },
      { icon: HelpCircle, title: "Affiliate Self-Service Portal", description: "A dedicated dashboard where affiliates can monitor performance, view earnings, and manage their account." },
    ],
  },
  {
    badge: "Developer Friendly",
    badgeColor: "cyan",
    title: "Modern architecture, built to extend",
    features: [
      { icon: Zap, title: "Next.js 15 App Router", description: "Built on the latest architecture with server components and edge runtime support." },
      { icon: Database, title: "PostgreSQL & Prisma ORM", description: "Type-safe database layer with automatic migrations and 15+ pre-defined data models." },
      { icon: Shield, title: "JWT Authentication", description: "Enterprise-grade HTTP-only cookie authentication with role-based access control." },
      { icon: Palette, title: "Tailwind CSS Design System", description: "A fully customizable interface built on a modern, utility-first design system." },
      { icon: Code2, title: "38+ RESTful API Endpoints", description: "Comprehensive coverage for admin, affiliate, tracking, and authentication operations." },
      { icon: Server, title: "Flexible Deployment Options", description: "Deploy via Docker, Vercel, or any VPS with complete setup documentation." },
    ],
  },
]

function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: typeof Users
  title: string
  description: string
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`group p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-0.5 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 transition-colors">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h4 className="text-sm font-semibold text-white mb-1.5">{title}</h4>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

export function FeaturesPageContent() {
  return (
    <div className="pt-28 pb-8">
      {/* Hero */}
      <section className="text-center px-4 mb-20">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          v1.1.0 — Real-Time Analytics & Webhook Events
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto">
          A complete toolkit for{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            affiliate program success
          </span>
        </h1>
        <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
          From acquisition to payouts, Refferq delivers enterprise-grade affiliate management capabilities — fully open source and ready to deploy.
        </p>
      </section>

      {/* Feature Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {featureSections.map((section) => (
          <section key={section.badge}>
            <div className="mb-8">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${section.badgeColor === 'emerald' ? 'emerald' : section.badgeColor === 'teal' ? 'teal' : 'cyan'}-500/10 border border-${section.badgeColor === 'emerald' ? 'emerald' : section.badgeColor === 'teal' ? 'teal' : 'cyan'}-500/20 text-${section.badgeColor === 'emerald' ? 'emerald' : section.badgeColor === 'teal' ? 'teal' : 'cyan'}-400 text-xs font-medium`}>
                {section.badge}
                {section.badgeNew && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-[10px] text-white font-bold">NEW</span>
                )}
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">{section.title}</h2>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
              {section.features.map((feature, i) => (
                <FeatureCard key={feature.title} {...feature} index={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
