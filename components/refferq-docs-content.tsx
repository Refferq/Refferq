"use client"

import { useState, useEffect } from "react"
import { Copy, Check, Terminal, BookOpen, Code2, Rocket, Settings, Users, BarChart3, Webhook, Shield, Server } from "lucide-react"

const sidebarSections = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quick Start" },
      { id: "installation", label: "Installation" },
      { id: "configuration", label: "Configuration" },
    ],
  },
  {
    title: "Features",
    items: [
      { id: "affiliates", label: "Affiliate Management" },
      { id: "tracking", label: "Tracking Setup" },
      { id: "commissions", label: "Commissions" },
      { id: "payouts", label: "Payouts" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { id: "auth", label: "Authentication" },
      { id: "api", label: "API Endpoints" },
      { id: "webhooks", label: "Webhooks" },
      { id: "reports", label: "Reports API" },
    ],
  },
  {
    title: "Deployment",
    items: [
      { id: "vercel", label: "Vercel" },
      { id: "docker", label: "Docker" },
      { id: "vps", label: "VPS / Cloud" },
    ],
  },
]

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-lg overflow-hidden bg-gray-950/80 border border-white/[0.06] my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-xs text-gray-500 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-400 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-gray-300 font-mono text-[13px] leading-relaxed">{code}</code>
      </pre>
    </div>
  )
}

function Callout({ type, children }: { type: "info" | "warning" | "success"; children: React.ReactNode }) {
  const styles = {
    info: "border-blue-500/30 bg-blue-500/5 text-blue-300",
    warning: "border-yellow-500/30 bg-yellow-500/5 text-yellow-300",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
  }

  return (
    <div className={`border-l-4 rounded-r-lg p-4 my-4 text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}

export function DocsPageContent() {
  const [activeSection, setActiveSection] = useState("introduction")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-100px 0px -60% 0px" }
    )

    sidebarSections.forEach((section) => {
      section.items.forEach((item) => {
        const el = document.getElementById(item.id)
        if (el) observer.observe(el)
      })
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden w-full flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-300"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>

          {/* Sidebar */}
          <aside
            className={`lg:block ${
              isSidebarOpen ? "block" : "hidden"
            } lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-hide`}
          >
            <nav className="space-y-6 pb-8">
              {sidebarSections.map((section) => (
                <div key={section.title}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                    {section.title}
                  </h4>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                            activeSection === item.id
                              ? "bg-emerald-500/10 text-emerald-400 font-medium"
                              : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                          }`}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 prose-invert max-w-none">
            {/* Introduction */}
            <section id="introduction" className="mb-16 scroll-mt-24">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Documentation</h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Welcome to the Refferq documentation. Refferq is an open-source affiliate marketing platform
                engineered with Next.js 15, TypeScript, PostgreSQL, and Prisma. This comprehensive guide walks you
                through installation, configuration, core features, API integration, and deployment.
              </p>
              <Callout type="info">
                Refferq v1.1.0 introduces real-time analytics dashboards, a full webhook event system, and the Reports API.
              </Callout>
            </section>

            {/* Quick Start */}
            <section id="quickstart" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-emerald-400" /> Quick Start
              </h2>
              <p className="text-gray-400 mb-4">Get Refferq up and running in under 5 minutes:</p>
              <CodeBlock
                language="bash"
                code={`# 1. Clone the repository
git clone https://github.com/Refferq/Refferq.git
cd Refferq

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# 4. Set up the database
npm run db:generate
npm run db:push

# 5. Start the dev server
npm run dev`}
              />
              <Callout type="success">
                Your Refferq instance will be running at <code className="text-emerald-300">http://localhost:3000</code>
              </Callout>
            </section>

            {/* Installation */}
            <section id="installation" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-6 h-6 text-emerald-400" /> Installation
              </h2>
              <h3 className="text-lg font-semibold text-white mb-2 mt-6">System Requirements</h3>
              <ul className="list-disc list-inside text-gray-400 space-y-1 mb-4">
                <li>Node.js 18+ (LTS recommended)</li>
                <li>PostgreSQL 12+</li>
                <li>npm or yarn</li>
              </ul>
              <h3 className="text-lg font-semibold text-white mb-2">Docker PostgreSQL</h3>
              <CodeBlock
                language="bash"
                code={`docker run --name refferq-db \\
  -e POSTGRES_USER=refferq \\
  -e POSTGRES_PASSWORD=your_password \\
  -e POSTGRES_DB=refferq \\
  -p 5432:5432 -d postgres:15`}
              />
            </section>

            {/* Configuration */}
            <section id="configuration" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6 text-emerald-400" /> Configuration
              </h2>
              <h3 className="text-lg font-semibold text-white mb-2">Required Environment Variables</h3>
              <CodeBlock
                language="env"
                code={`DATABASE_URL=postgresql://user:password@localhost:5432/refferq
JWT_SECRET=your-secret-min-32-characters-long
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com`}
              />
              <h3 className="text-lg font-semibold text-white mb-2 mt-6">Optional Variables</h3>
              <CodeBlock
                language="env"
                code={`ADMIN_EMAILS=admin@yourdomain.com
NODE_ENV=production`}
              />
            </section>

            {/* Affiliate Management */}
            <section id="affiliates" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-400" /> Affiliate Management
              </h2>
              <p className="text-gray-400 mb-4">Affiliates go through a registration flow with OTP verification:</p>
              <ol className="list-decimal list-inside text-gray-400 space-y-2 mb-4">
                <li>Affiliate submits registration form</li>
                <li>OTP sent to their email for verification</li>
                <li>Account created with <code className="text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">PENDING</code> status</li>
                <li>Admin reviews and approves</li>
                <li>Affiliate receives approval email with referral code</li>
              </ol>
              <Callout type="info">
                Affiliate statuses: <code>PENDING</code>, <code>ACTIVE</code>, <code>SUSPENDED</code>, <code>REJECTED</code>
              </Callout>
            </section>

            {/* Tracking Setup */}
            <section id="tracking" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-400" /> Tracking Setup
              </h2>
              <h3 className="text-lg font-semibold text-white mb-2">JavaScript Tracker</h3>
              <p className="text-gray-400 mb-4">Add the tracking script to your website:</p>
              <CodeBlock
                language="html"
                code={`<!-- Add before closing </body> tag -->
<script src="https://yourdomain.com/scripts/refferq-tracker.js"
        data-site="your-site-id">
</script>`}
              />
              <h3 className="text-lg font-semibold text-white mb-2 mt-6">Server-Side Tracking</h3>
              <CodeBlock
                language="javascript"
                code={`// Record a conversion via API
const response = await fetch('/api/track/conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    referralCode: 'JOHN-A1B2',
    amountCents: 9900, // $99.00
    metadata: { orderId: 'ORD-123' }
  })
});`}
              />
            </section>

            {/* Commissions */}
            <section id="commissions" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Rocket className="w-6 h-6 text-emerald-400" /> Commissions
              </h2>
              <p className="text-gray-400 mb-4">
                Commission rates are configured at the partner group level. Each affiliate automatically inherits the commission rate of their assigned group:
              </p>
              <CodeBlock
                language="typescript"
                code={`// Commission calculation
const rate = affiliate.partnerGroup?.commissionRate || defaultRate;
const commissionCents = Math.round(amountCents * (rate / 100));

// All monetary values stored as cents (integers)
// Display: (amountCents / 100).toFixed(2)`}
              />
            </section>

            {/* Payouts */}
            <section id="payouts" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4">Payouts</h2>
              <p className="text-gray-400 mb-4">Manage affiliate payouts through the admin panel:</p>
              <ol className="list-decimal list-inside text-gray-400 space-y-2">
                <li>Affiliate accrues commission balance from conversions</li>
                <li>Affiliate requests payout (or admin initiates)</li>
                <li>Admin reviews and approves the payout request</li>
                <li>Admin processes payment via preferred method</li>
                <li>Payout marked as completed, balance updated</li>
              </ol>
            </section>

            {/* Authentication */}
            <section id="auth" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-emerald-400" /> Authentication
              </h2>
              <p className="text-gray-400 mb-4">Refferq uses JWT tokens stored in HTTP-only cookies:</p>
              <CodeBlock
                language="bash"
                code={`# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "your-password"
}

# Response sets auth-token cookie automatically`}
              />
            </section>

            {/* API Endpoints */}
            <section id="api" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Code2 className="w-6 h-6 text-emerald-400" /> API Endpoints
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    group: "Authentication",
                    endpoints: [
                      { method: "POST", path: "/api/auth/login", desc: "Login" },
                      { method: "POST", path: "/api/auth/register", desc: "Register" },
                      { method: "POST", path: "/api/auth/logout", desc: "Logout" },
                      { method: "GET", path: "/api/auth/me", desc: "Get current user" },
                    ],
                  },
                  {
                    group: "Admin",
                    endpoints: [
                      { method: "GET", path: "/api/admin/affiliates", desc: "List affiliates" },
                      { method: "GET", path: "/api/admin/referrals", desc: "List referrals" },
                      { method: "GET", path: "/api/admin/transactions", desc: "List transactions" },
                      { method: "GET", path: "/api/admin/payouts", desc: "List payouts" },
                      { method: "GET", path: "/api/admin/partner-groups", desc: "Partner groups" },
                      { method: "GET", path: "/api/admin/settings", desc: "Settings" },
                    ],
                  },
                  {
                    group: "Affiliate",
                    endpoints: [
                      { method: "GET", path: "/api/affiliate/dashboard", desc: "Dashboard data" },
                      { method: "GET", path: "/api/affiliate/referrals", desc: "My referrals" },
                      { method: "GET", path: "/api/affiliate/commissions", desc: "My commissions" },
                      { method: "POST", path: "/api/affiliate/payout", desc: "Request payout" },
                    ],
                  },
                  {
                    group: "Tracking",
                    endpoints: [
                      { method: "POST", path: "/api/track/click", desc: "Track click" },
                      { method: "POST", path: "/api/track/conversion", desc: "Track conversion" },
                    ],
                  },
                ].map((group) => (
                  <div key={group.group}>
                    <h3 className="text-lg font-semibold text-white mb-3">{group.group}</h3>
                    <div className="space-y-1.5">
                      {group.endpoints.map((ep) => (
                        <div
                          key={ep.path}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                        >
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              ep.method === "GET"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }`}
                          >
                            {ep.method}
                          </span>
                          <code className="text-sm text-gray-300 font-mono">{ep.path}</code>
                          <span className="text-xs text-gray-500 ml-auto hidden sm:block">{ep.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Webhook className="w-6 h-6 text-emerald-400" /> Webhooks
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-medium mb-4">
                New in v1.1.0
              </span>
              <p className="text-gray-400 mb-4">Refferq supports 12 webhook event types for real-time system integration:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                {[
                  "affiliate.created", "affiliate.approved", "affiliate.suspended",
                  "referral.created", "referral.converted", "referral.expired",
                  "commission.created", "commission.approved", "commission.paid",
                  "payout.requested", "payout.approved", "payout.completed",
                ].map((event) => (
                  <div key={event} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-gray-300 font-mono">
                    {event}
                  </div>
                ))}
              </div>
              <Callout type="info">
                All webhooks are signed with HMAC-SHA256 for security. Failed deliveries are retried with exponential backoff.
              </Callout>
            </section>

            {/* Reports API */}
            <section id="reports" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4">Reports API</h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-medium mb-4">
                New in v1.1.0
              </span>
              <CodeBlock
                language="bash"
                code={`GET /api/admin/reports/analytics?startDate=2025-01-01&endDate=2025-12-31

# Response
{
  "totalClicks": 15420,
  "totalConversions": 892,
  "conversionRate": 5.78,
  "totalRevenueCents": 8920000,
  "totalCommissionCents": 892000,
  "topAffiliates": [...]
}`}
              />
            </section>

            {/* Deployment - Vercel */}
            <section id="vercel" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Server className="w-6 h-6 text-emerald-400" /> Deploy to Vercel
              </h2>
              <ol className="list-decimal list-inside text-gray-400 space-y-2 mb-4">
                <li>Push your code to GitHub</li>
                <li>Import the repository in Vercel</li>
                <li>Set all environment variables</li>
                <li>Deploy — Vercel handles the rest</li>
              </ol>
              <Callout type="success">
                Vercel&apos;s free tier is sufficient for most small to medium affiliate programs.
              </Callout>
            </section>

            {/* Deployment - Docker */}
            <section id="docker" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4">Docker Deployment</h2>
              <CodeBlock
                language="yaml"
                code={`# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://refferq:password@db:5432/refferq
      - JWT_SECRET=your-secret-here
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=refferq
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=refferq
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:`}
              />
            </section>

            {/* Deployment - VPS */}
            <section id="vps" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold text-white mb-4">VPS / Cloud Deployment</h2>
              <CodeBlock
                language="bash"
                code={`# Install PM2
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "refferq" -- start

# Enable startup script
pm2 startup
pm2 save`}
              />
            </section>

            {/* Help */}
            <section className="mb-16 scroll-mt-24 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Need Help?</h2>
              <p className="text-gray-400 mb-6">Our community and documentation are here to support you at every step.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <a
                  href="https://github.com/Refferq/Refferq/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/20 text-sm text-gray-300 hover:text-emerald-400 transition-all"
                >
                  Community Discussions
                </a>
                <a
                  href="https://github.com/Refferq/Refferq/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-emerald-500/10 border border-white/[0.08] hover:border-emerald-500/20 text-sm text-gray-300 hover:text-emerald-400 transition-all"
                >
                  Report a Bug
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
