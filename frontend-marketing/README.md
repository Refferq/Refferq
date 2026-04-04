# Refferq Frontend

> Modern marketing website for [Refferq](https://refferq.com) — the open-source affiliate marketing platform.

Built with **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Framer Motion**. Optimized for SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

## Live

| | URL |
|---|---|
| **Website** | [refferq.com](https://refferq.com) |
| **Application** | [app.refferq.com](https://app.refferq.com) |
| **Repository** | [github.com/Refferq/frontend](https://github.com/Refferq/frontend) |

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout, global metadata, JSON-LD schemas
│   ├── page.tsx                # Homepage (/, landing page)
│   ├── features/page.tsx       # Features page (/features)
│   ├── pricing/page.tsx        # Pricing page (/pricing)
│   ├── docs/page.tsx           # Documentation page (/docs)
│   ├── globals.css             # Global styles
│   ├── sitemap.ts              # Dynamic sitemap generation
│   ├── robots.ts               # Dynamic robots.txt generation
│   ├── opengraph-image.tsx     # Dynamic OG image (Edge runtime)
│   └── twitter-image.tsx       # Dynamic Twitter card image (Edge runtime)
├── components/
│   ├── refferq-nav.tsx         # Navigation bar
│   ├── refferq-hero.tsx        # Hero section
│   ├── refferq-features.tsx    # Features grid
│   ├── refferq-how-it-works.tsx# How it works steps
│   ├── refferq-comparison.tsx  # Competitor comparison table
│   ├── refferq-pricing.tsx     # Pricing cards
│   ├── refferq-pricing-faq.tsx # Pricing FAQ accordion
│   ├── refferq-testimonials.tsx# Testimonials
│   ├── refferq-cta.tsx         # Call-to-action section
│   ├── refferq-footer.tsx      # Footer
│   ├── refferq-features-page.tsx # Features page content
│   ├── refferq-docs-content.tsx  # Docs page content
│   ├── Aurora.tsx              # Animated aurora background
│   ├── RotatingText.tsx        # Rotating text animation
│   ├── page-transition.tsx     # Page transition wrapper
│   ├── navigation-transition.tsx # Navigation transition
│   ├── theme-provider.tsx      # Dark/light theme provider
│   └── ui/                     # shadcn/ui component library
├── hooks/
│   ├── use-mobile.ts           # Mobile detection hook
│   └── use-toast.ts            # Toast notification hook
├── lib/
│   └── utils.ts                # Utility functions (cn, etc.)
├── public/
│   ├── sitemap.xml             # Static sitemap with image extensions
│   ├── robots.txt              # Static robots.txt with AI bot rules
│   ├── manifest.json           # PWA manifest
│   ├── llms.txt                # GEO: LLM context (llms.txt spec)
│   ├── llms-full.txt           # GEO: Full AI context document
│   ├── humans.txt              # Team & tech credits
│   ├── og-image.svg            # Fallback OG image
│   ├── icon.svg                # Favicon
│   └── .well-known/
│       ├── security.txt        # RFC 9116 security contact
│       └── ai-plugin.json      # AI plugin discovery manifest
├── next.config.mjs             # Next.js config (headers, redirects, caching)
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** 18.17+
- **npm** 9+ (or pnpm / yarn)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Refferq/frontend.git
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.7 |
| **UI** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion 12 |
| **Components** | shadcn/ui + Radix UI |
| **Icons** | Lucide React |
| **Analytics** | Vercel Analytics + Speed Insights |
| **Font** | Inter (Google Fonts, `display: swap`) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, how it works, comparison, pricing, testimonials, CTA |
| `/features` | Detailed feature breakdown — 6 categories, 28+ individual features |
| `/pricing` | Pricing plans — Self-Hosted (free) vs Managed Cloud ($29/mo), FAQ, competitor comparison |
| `/docs` | Documentation — quick start, API reference, deployment guides (Docker, Vercel) |

## SEO & Optimization

### Search Engine Optimization (SEO)

- **Metadata**: Per-page title, description, keywords, canonical URLs, Open Graph, Twitter Cards
- **Structured Data (JSON-LD)**: Organization, WebSite (with SearchAction), SoftwareApplication, BreadcrumbList, FAQPage, Product, TechArticle, ItemList
- **Sitemaps**: Dynamic (`sitemap.ts`) + static (`sitemap.xml` with image extensions)
- **Robots**: Dynamic (`robots.ts`) + static (`robots.txt`) with granular per-agent rules
- **OG Images**: Dynamically generated via Edge runtime (`opengraph-image.tsx`, `twitter-image.tsx`)
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy via `next.config.mjs`
- **Caching**: Static assets (1 year), SEO files (1 day)
- **Redirects**: Common URL typos handled (`/home` → `/`, `/feature` → `/features`, etc.)

### Answer Engine Optimization (AEO)

- FAQ structured data on pricing page (6 Q&A pairs)
- Clear, scannable content with semantic HTML
- Descriptive headings that match common search queries

### Generative Engine Optimization (GEO)

- **llms.txt**: Concise structured context following the [llms.txt specification](https://llmstxt.org/)
- **llms-full.txt**: Full-context AI document (~200 lines) with complete feature details
- **ai-plugin.json**: OpenAI plugin manifest for AI discovery
- **robots.txt**: Explicit allow rules for GPTBot, PerplexityBot, anthropic-ai, Cohere, YouBot

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect the [GitHub repository](https://github.com/Refferq/frontend) directly in the Vercel dashboard for automatic deployments on push.

### Docker

```bash
# Build
docker build -t refferq-frontend .

# Run
docker run -p 3000:3000 refferq-frontend
```

### Self-Hosted (Node.js)

```bash
npm run build
npm run start
```

The server starts on port 3000 by default. Use a reverse proxy (Nginx, Caddy) for production.

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Base URL for the marketing site (e.g., `https://refferq.com`) | No |

### Customizing URLs

Update these files if deploying to a different domain:

- `app/layout.tsx` — `metadataBase`, canonical URLs
- `app/sitemap.ts` — base URL
- `public/sitemap.xml` — all `<loc>` tags
- `public/robots.txt` — sitemap URL
- `public/manifest.json` — `start_url`, `scope`
- `public/.well-known/security.txt` — canonical URL

### Customizing Branding

- **Colors**: Edit Tailwind config and `globals.css` (emerald/teal theme)
- **Logo**: Replace `public/icon.svg` and update nav component
- **Content**: Edit component files in `components/`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Run lint: `npm run lint`
5. Commit: `git commit -m "feat: description"`
6. Push and open a pull request

## License

MIT — See [LICENSE](../LICENSE) for details.

## Support

| Channel | Link |
|---------|------|
| **Documentation** | [refferq.com/docs](https://refferq.com/docs) |
| **Issues** | [GitHub Issues](https://github.com/Refferq/frontend/issues) |
| **Discussions** | [GitHub Discussions](https://github.com/Refferq/Refferq/discussions) |
| **Email** | hello@refferq.com |

---

**Made with ❤️ by the Refferq community**

[Star on GitHub](https://github.com/Refferq/Refferq) · [Report Bug](https://github.com/Refferq/frontend/issues) · [Request Feature](https://github.com/Refferq/Refferq/discussions)
