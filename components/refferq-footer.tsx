"use client"

import Link from "next/link"
import Image from "next/image"
import { Github, Twitter } from "lucide-react"

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs#api" },
      { label: "Changelog", href: "/docs#changelog" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Quick Start", href: "/docs#quickstart" },
      { label: "Deployment", href: "/docs#deployment" },
      { label: "GitHub", href: "https://github.com/Refferq/Refferq", external: true },
      { label: "Discussions", href: "https://github.com/Refferq/Refferq/discussions", external: true },
      { label: "Issues", href: "https://github.com/Refferq/Refferq/issues", external: true },
    ],
  },
  company: {
    title: "Legal",
    links: [
      { label: "MIT License", href: "https://github.com/Refferq/Refferq/blob/main/LICENSE", external: true },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "/docs#security" },
    ],
  },
}

export function RefferqFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Refferq Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white tracking-tight">Refferq</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 max-w-sm leading-relaxed">
              The open-source affiliate marketing platform built for modern businesses. Self-hosted, endlessly customizable, and free forever.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="https://github.com/Refferq/Refferq"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/[0.06] flex items-center justify-center transition-all duration-200 group"
              >
                <Github className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </Link>
              <Link
                href="https://twitter.com/refferq"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/[0.06] flex items-center justify-center transition-all duration-200 group"
              >
                <Twitter className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={(link as any).external ? "_blank" : undefined}
                      rel={(link as any).external ? "noopener noreferrer" : undefined}
                      className="text-sm text-gray-500 hover:text-emerald-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Refferq. Released under the MIT License.
          </p>
          <p className="text-xs text-gray-600">
            Built with Next.js, PostgreSQL & Prisma — Made for the open-source community
          </p>
        </div>
      </div>
    </footer>
  )
}
