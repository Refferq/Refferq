"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Is Refferq really free?",
    answer: "Absolutely. Refferq is 100% free and open source under the MIT License. Self-host it on your own infrastructure at zero cost — there are no hidden fees, no per-transaction charges, and no usage limits. You get the complete platform with every feature included.",
  },
  {
    question: "What are the hosting requirements?",
    answer: "Refferq requires Node.js 18 or later and PostgreSQL 12 or later. It runs efficiently on any VPS with as little as 1 GB of RAM, on Vercel's free tier, or as a Docker container. A typical setup takes approximately 15 minutes from start to finish.",
  },
  {
    question: "Can I customize Refferq?",
    answer: "Yes — extensively. You have full access to the source code, which means you can customize everything from the user interface and branding to commission rules and tracking logic. The stack — Next.js 15, TypeScript, and Tailwind CSS — is designed for rapid, maintainable customization.",
  },
  {
    question: "How does the tracking work?",
    answer: "Refferq includes a lightweight JavaScript tracking script that you embed on your website. It captures referral clicks through unique affiliate codes via /r/[code] routes or ?ref=CODE parameters, records conversions through the API, and automatically attributes commissions to the correct affiliate.",
  },
  {
    question: "What kind of support is available?",
    answer: "The self-hosted edition includes community support through GitHub Discussions and Issues, along with comprehensive documentation covering setup, API reference, and deployment guides. The upcoming Managed Cloud plan will include dedicated email support with guaranteed response times.",
  },
  {
    question: "Can I migrate from another platform?",
    answer: "Yes. Refferq's REST API makes it straightforward to import affiliate records, referral history, and commission data from other platforms. Our documentation includes step-by-step migration guides for popular affiliate management tools.",
  },
]

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`border border-white/[0.06] rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? "bg-white/[0.04] border-emerald-500/20" : "bg-white/[0.02] hover:bg-white/[0.03]"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-emerald-400" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export function PricingFAQ() {
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-400">
            Have questions? Here are the answers to the most common inquiries about Refferq.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.question}
              className={`transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <FAQItem {...faq} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
