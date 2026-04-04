"use client"

import { useRef, useState, useEffect } from "react"
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
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Affiliate Management",
    description: "Onboard, approve, and manage affiliates with custom referral codes, partner group segmentation, and real-time performance insights.",
    color: "emerald",
  },
  {
    icon: Activity,
    title: "Real-Time Analytics",
    description: "Monitor clicks, conversions, and revenue as they happen with a lightweight JavaScript tracking snippet that integrates in minutes.",
    color: "teal",
  },
  {
    icon: Percent,
    title: "Flexible Commission Rules",
    description: "Configure percentage-based, fixed-amount, or tiered commission structures. Assign rates per partner group for precise control.",
    color: "cyan",
  },
  {
    icon: Mail,
    title: "Automated Email Notifications",
    description: "Keep affiliates informed at every stage — from sign-up approvals and conversion alerts to payout confirmations, powered by Resend.",
    color: "emerald",
  },
  {
    icon: Code2,
    title: "Comprehensive REST API",
    description: "Access 38+ fully documented endpoints with JWT authentication. Integrate admin, affiliate, and tracking workflows programmatically.",
    color: "teal",
  },
  {
    icon: Server,
    title: "Self-Hosted & Portable",
    description: "Deploy on your own infrastructure — Docker, Vercel, or any VPS. Maintain full control with zero vendor lock-in.",
    color: "cyan",
  },
]

const advancedFeatures = [
  { icon: BarChart3, title: "Analytics Dashboard", description: "Gain actionable insights with real-time metrics, conversion funnels, and top-performer leaderboards." },
  { icon: Globe, title: "Geographic Tracking", description: "Identify your highest-performing regions with built-in IP-based geographic data collection." },
  { icon: Webhook, title: "Webhook System", description: "Subscribe to 12 event types with HMAC-SHA256 security, automatic retries, and delivery tracking." },
  { icon: Shield, title: "Secure Authentication", description: "Enterprise-grade JWT authentication with HTTP-only cookies and role-based access control." },
  { icon: Zap, title: "Built on Next.js 15", description: "Leverages the latest App Router architecture with server components and edge runtime support." },
  { icon: Database, title: "PostgreSQL & Prisma ORM", description: "Production-ready database layer with type-safe queries and automatic schema migrations." },
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
      className={`group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all duration-500 hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

export function RefferqFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="relative py-24 sm:py-32" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            Core Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Everything you need to run{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              a high-performing affiliate program
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Purpose-built tools to acquire, manage, track, and reward your affiliate partners — all from a single platform.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>

        {/* Developer Features */}
        <div className="mt-24">
          <div
            className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-4">
              Built for Developers
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Modern tech stack, extensible by design
            </h3>
            <p className="mt-3 text-gray-400 text-base">
              Built on industry-standard technologies so your team can customize, extend, and deploy with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className={`flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-emerald-500/15 transition-all duration-300`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
