"use client"

import { useRef, useState, useEffect } from "react"
import { UserPlus, Link2, BarChart3, Wallet, ArrowRight } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Affiliate Registration",
    description: "Affiliates apply through your branded registration portal. Approve manually or enable auto-approval based on your criteria.",
  },
  {
    icon: Link2,
    step: "02",
    title: "Distribute Referral Links",
    description: "Each affiliate receives a unique referral code with trackable links via dedicated /r/[code] routes or ?ref=CODE parameters.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Monitor Conversions",
    description: "A lightweight tracking script captures every click and conversion in real time. Review all activity from your admin dashboard.",
  },
  {
    icon: Wallet,
    step: "04",
    title: "Process Payouts",
    description: "Commissions are calculated automatically based on your configured rules. Review and approve payouts from a centralized admin panel.",
  },
]

export function RefferqHowItWorks() {
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
    <section className="relative py-24 sm:py-32" ref={ref}>
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            From registration to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              payout in four steps
            </span>
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            A streamlined workflow designed to get your affiliate program operational in minutes, not weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={step.step}
              className={`relative group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-px">
                  <div className="w-full h-full bg-gradient-to-r from-emerald-500/30 to-emerald-500/5" />
                  <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-emerald-500/30" />
                </div>
              )}

              <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all duration-300 group-hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <step.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-emerald-500/50 tracking-widest uppercase">Step {step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
