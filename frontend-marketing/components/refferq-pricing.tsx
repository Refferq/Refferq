"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { Check, ArrowRight, Sparkles } from "lucide-react"

const plans = [
  {
    name: "Self-Hosted",
    price: "$0",
    period: "forever",
    description: "Full-featured affiliate management on your own infrastructure. No limits, no strings attached.",
    featured: true,
    cta: "Get Started Free",
    ctaHref: "https://github.com/Refferq/Refferq",
    features: [
      "Unlimited affiliates",
      "Unlimited referrals & conversions",
      "Real-time analytics dashboard",
      "API access (38+ endpoints)",
      "Webhooks (12 event types)",
      "Email notifications (Resend)",
      "White-label / custom branding",
      "Complete source code",
      "Community support",
      "MIT License",
    ],
  },
  {
    name: "Managed Cloud",
    price: "$29",
    period: "/month",
    description: "Fully managed hosting with automatic updates, backups, and dedicated support — so you can focus on growth.",
    featured: false,
    cta: "Coming Soon",
    ctaHref: "#",
    badge: "Coming Soon",
    features: [
      "Everything in Self-Hosted",
      "Managed hosting & SSL",
      "Automatic updates",
      "Daily database backups",
      "Email support (24h response)",
      "99.9% SLA uptime",
      "Custom domain support",
      "Monitoring & alerts",
      "Priority feature requests",
    ],
  },
]

export function RefferqPricing() {
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
    <section id="pricing" className="relative py-24 sm:py-32" ref={ref}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            Pricing Plans
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Simple,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            No hidden fees, no per-transaction charges, and no surprise invoices. Enterprise-grade affiliate tools at a price that works for every business.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              } ${
                plan.featured
                  ? "bg-gradient-to-b from-emerald-500/10 to-emerald-500/[0.02] border-2 border-emerald-500/30 shadow-xl shadow-emerald-500/10"
                  : "bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12]"
              }`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/30">
                  {plan.badge}
                </span>
              )}
              {plan.featured && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                <span className="text-gray-500 text-lg">{plan.period}</span>
              </div>

              <Link
                href={plan.ctaHref}
                target={plan.ctaHref.startsWith("http") ? "_blank" : undefined}
                className={`group flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.featured
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
                } ${!plan.featured && plan.badge ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {plan.cta}
                {plan.featured && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
