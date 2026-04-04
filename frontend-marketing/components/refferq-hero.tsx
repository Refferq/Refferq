"use client"

import Link from "next/link"
import { ArrowRight, Github, Star, Shield, DollarSign } from "lucide-react"
import RotatingText from "@/components/RotatingText"

const stats = [
  { icon: DollarSign, value: "$0", label: "Zero Platform Fees" },
  { icon: Shield, value: "100%", label: "Full Data Ownership" },
  { icon: Star, value: "MIT", label: "Open Source License" },
]

export function RefferqHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-badge">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              v1.1.0 &bull; Trusted by Growing Businesses &bull; MIT Licensed
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] animate-fade-in-heading">
            The affiliate platform{" "}
            <br className="hidden sm:block" />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                <RotatingText
                  texts={["you own", "you control", "that scales", "that's free"]}
                  mainClassName="inline-block"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={3000}
                />
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-subheading">
            Launch and scale your affiliate program without recurring fees or vendor lock-in.
            Refferq is a self-hosted, open-source platform that gives you complete ownership
            of your data and infrastructure.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-buttons">
            <Link
              href="https://app.refferq.com/register"
              className="group flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all duration-300 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]"
            >
              Get Started — It's Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="https://github.com/Refferq/Refferq"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 animate-fade-in-trust">
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 mb-2 group-hover:bg-emerald-500/20 transition-colors">
                    <stat.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
