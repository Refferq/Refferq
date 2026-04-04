"use client"

import { useRef, useState, useEffect } from "react"
import { Check, X } from "lucide-react"

const rows = [
  { feature: "Unlimited Affiliates", refferq: true, others: true },
  { feature: "Self-Hosted Deployment", refferq: true, others: false },
  { feature: "Full Source Code Access", refferq: true, others: false },
  { feature: "Zero Transaction Fees", refferq: true, others: "+$99/mo" },
  { feature: "API Access (38+ Endpoints)", refferq: true, others: "+$99/mo" },
  { feature: "Webhook Events (12 Types)", refferq: true, others: false },
  { feature: "White-Label Branding", refferq: true, others: false },
  { feature: "Real-Time Analytics", refferq: true, others: true },
  { feature: "Automated Email Notifications", refferq: true, others: true },
  { feature: "Setup & Onboarding Fee", refferq: "$0", others: "$299–$999" },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
    )
  }
  if (value === false) {
    return (
      <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center">
        <X className="w-4 h-4 text-red-400/60" />
      </div>
    )
  }
  return <span className="text-sm text-gray-400">{value}</span>
}

export function RefferqComparison() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            Comparison
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            See how Refferq{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">stacks up against the competition</span>
          </h2>
          <p className="mt-3 text-gray-400 text-base">
            Full-featured affiliate management without the enterprise price tag.
          </p>
        </div>

        {/* Comparison Table */}
        <div
          className={`rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden backdrop-blur-sm transition-all duration-700 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Header */}
          <div className="grid grid-cols-3 gap-0 border-b border-white/[0.08]">
            <div className="p-4 sm:p-5 text-sm text-gray-500 font-medium">Feature</div>
            <div className="p-4 sm:p-5 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
                    <path d="M3 6h12M3 9h12M3 12h7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-white">Refferq</span>
              </div>
              <div className="text-emerald-400 text-xs font-medium mt-1">$0/month</div>
            </div>
            <div className="p-4 sm:p-5 text-center">
              <span className="text-sm font-medium text-gray-400">Others</span>
              <div className="text-gray-500 text-xs mt-1">$49-299/mo</div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 gap-0 transition-all duration-500 ${
                i < rows.length - 1 ? "border-b border-white/[0.04]" : ""
              } hover:bg-white/[0.02] ${
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
              style={{ transitionDelay: `${300 + i * 60}ms` }}
            >
              <div className="p-4 sm:p-5 text-sm text-gray-300">{row.feature}</div>
              <div className="p-4 sm:p-5 flex items-center justify-center">
                <CellValue value={row.refferq} />
              </div>
              <div className="p-4 sm:p-5 flex items-center justify-center">
                <CellValue value={row.others} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
