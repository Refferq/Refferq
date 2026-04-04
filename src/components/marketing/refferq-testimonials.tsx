"use client"

import { useRef, useState, useEffect } from "react"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder & CEO, SaaS Co",
    content: "We migrated from a $299/month platform to Refferq and haven't looked back. The feature parity is remarkable, and our affiliate program has grown 3x since the switch.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "VP of Marketing, TechForward",
    content: "The self-hosted model gives us complete control over affiliate data and compliance. No more concerns about third-party data handling or sudden pricing changes.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Head of E-commerce, Luxe Retail",
    content: "Deployment took 15 minutes with Docker. The API documentation is thorough, and the codebase is exceptionally well-structured. Best open-source affiliate solution available.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Senior Software Engineer",
    content: "Built on Next.js 15 with Prisma — a modern stack our team already knows well. Contributing back to the open-source community has been a rewarding experience.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Growth Lead, FinScale",
    content: "Real-time tracking and the webhook system made integration with our existing stack seamless. The flexible commission rules handle our complex payout structures perfectly.",
    rating: 5,
  },
  {
    name: "Tom Wright",
    role: "Managing Director, Digital Agency",
    content: "We now deploy Refferq for every client engagement. The white-label capabilities and MIT license make it the ideal solution for agencies managing multiple programs.",
    rating: 5,
  },
]

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0]
  index: number
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-emerald-500/15 transition-all duration-300`}
    >
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-emerald-400 fill-emerald-400" />
        ))}
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-4">&ldquo;{testimonial.content}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="text-sm font-bold text-emerald-400">
            {testimonial.name.charAt(0)}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-white">{testimonial.name}</div>
          <div className="text-xs text-gray-500">{testimonial.role}</div>
        </div>
      </div>
    </div>
  )
}

export function RefferqTestimonials() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`text-center max-w-3xl mx-auto mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Trusted by teams and businesses{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">around the globe</span>
          </h2>
          <p className="mt-3 text-gray-400 text-base">
            See how companies of all sizes are growing their revenue with Refferq.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              <TestimonialCard testimonial={t} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
