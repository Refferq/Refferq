[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://opensource.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Buy Me a Coffee](https://img.shields.io/badge/☕-Buy%20me%20a%20coffee-ffdd00?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/refferq)
# Refferq - Open Source Affiliate Management Platform
[![Open Collective](https://img.shields.io/badge/OpenCollective-Support%20Us-3385FF?style=for-the-badge&logo=open-collective&logoColor=white)](https://opencollective.com/refferq)
<p align="center">
  <img src="./public/images/github-banner.svg" alt="Refferq Logo" width="200"/>
</p>

<p align="center">
  <strong>A powerful, feature-rich affiliate marketing platform built with Next.js 15 and PostgreSQL</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

---

## 📋 About

**Refferq** is a comprehensive affiliate management platform designed to help businesses create, manage, and scale their affiliate programs. Built with modern web technologies, it provides a complete solution for tracking referrals, managing commissions, and engaging with affiliate partners.

### 🎯 Key Highlights

- **Complete Affiliate Portal** - Full-featured dashboard for affiliates to track earnings, submit leads, and manage payouts
- **Admin Control Panel** - Comprehensive admin dashboard for managing partners, referrals, and program settings
- **Real-time Analytics** - Track conversions, commissions, and performance metrics in real-time
- **Automated Workflows** - Automated commission calculations, payout processing, and email notifications
- **Flexible Commission Rules** - Support for percentage-based and fixed commission structures
- **White-Label Ready** - Customizable branding and subdomain support

---

## ✨ Features

### For Admins

- **Dashboard Analytics**
  - Real-time revenue tracking
  - Conversion rate analytics
  - Partner performance metrics
  - Visual charts and reports

- **Partner Management**
  - Approve/reject affiliate applications
  - Manage partner groups
  - Set custom commission rates
  - View partner activity logs

- **Referral Management**
  - Review and approve lead submissions
  - Track referral status (Pending, Approved, Rejected)
  - Manual lead conversion tracking
  - Bulk operations support

- **Commission & Payouts**
  - Automated commission calculations
  - Flexible commission rules
  - Payout scheduling (NET-15, NET-30, etc.)
  - Multiple payout methods (PayPal, Bank Transfer, Stripe, Wise)

- **Program Settings**
  - Customizable program details
  - Branding configuration (colors, logos)
  - Cookie tracking settings
  - Country blocking
  - Terms of Service management

- **Email Automation**
  - Welcome emails for new partners
  - Referral notification emails
  - Commission approval alerts
  - Payout confirmation emails
  - Customizable email templates

### For Affiliates

- **Personal Dashboard**
  - Earnings overview (total, pending, paid)
  - Click tracking
  - Lead conversion metrics
  - Recent referral activity

- **Referral Management**
  - Submit leads manually
  - Track referral status
  - View commission breakdown
  - Filter by status (All, Pending, Approved)

- **Marketing Resources**
  - Unique referral link
  - Shareable referral code
  - Copy-to-clipboard functionality
  - Social media sharing buttons

- **Payout Tracking**
  - View payout history
  - Track payout status
  - Next payout schedule
  - Earnings breakdown

- **Account Settings**
  - Update personal details
  - Configure payment methods
  - Set payout preferences
  - Manage notification settings

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.2.3** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma** - Modern ORM with type safety

### Authentication & Security
- **JWT (jose)** - JSON Web Tokens for auth
- **bcryptjs** - Password hashing
- **OTP Verification** - Email-based verification

### Styling
- **Tailwind CSS** - Utility-first CSS
- **Recharts** - Data visualization charts

### Email
- **Resend** - Modern email API for transactional emails
- **Email Templates** - Customizable HTML templates

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static typing

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** or **yarn** or **pnpm**

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/refferq.git
cd refferq
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/refferq"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Email Configuration (Resend)
# Sign up at https://resend.com for free API key
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"

# Admin Notification Emails (comma-separated)
ADMIN_EMAILS="admin@yourdomain.com"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Step 4: Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed database with sample data
npx prisma db seed
```

### Step 5: Email Configuration

Refferq uses [Resend](https://resend.com) for sending transactional emails. Follow these steps:

1. **Sign up for Resend**
   - Go to [https://resend.com](https://resend.com)
   - Create a free account (3,000 emails/month)

2. **Get your API Key**
   - Navigate to API Keys in Resend dashboard
   - Create a new API key
   - Copy the key (starts with `re_...`)

3. **Update .env.local**
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"
   ADMIN_EMAILS="admin@yourdomain.com"
   ```

4. **Test Email Setup** (Optional)
   ```bash
   curl -X POST http://localhost:3000/api/admin/emails/test \
     -H "Content-Type: application/json" \
     -d '{"type": "welcome", "to": "test@example.com"}'
   ```

> **Note:** For production, verify your domain in Resend dashboard to use your own email addresses. See [docs/EMAIL.md](./docs/EMAIL.md) for detailed configuration guide.

### Step 6: Run Development Server

```bash
npm run dev
```

Open [https://app.refferq.com](https://app.refferq.com) or your configured domain in your browser.
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 7: Create Admin Account

1. Register at `/register`
2. Use the registration form to create your account
3. Manually update the user role in the database:

```sql
UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'your-email@example.com';
```

> **Note:** New affiliates are set to `PENDING` status by default and require admin approval. Admins should be set to `ACTIVE` status.

---

## 📦 Deployment

### Deploy on Vercel

The easiest way to deploy Refferq is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/refferq)

#### Manual Deployment Steps:

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Set `DATABASE_URL` to your production database

4. **Deploy**
   - Vercel will automatically build and deploy
   - Get your production URL: `https://your-project.vercel.app`

For detailed deployment instructions, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment steps
- [Database Schema](./docs/DATABASE.md) - Database structure and models
- [Email Configuration](./docs/EMAIL.md) - Email setup and templates guide
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

---

## 🗂️ Project Structure

```
refferq/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── images/                # Static assets
├── src/
│   ├── app/
│   │   ├── admin/            # Admin dashboard
│   │   ├── affiliate/        # Affiliate dashboard
│   │   ├── api/              # API routes
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── affiliate/    # Affiliate endpoints
│   │   │   └── auth/         # Authentication
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── components/           # React components
│   ├── hooks/                # Custom hooks
│   ├── context/              # React context
│   └── icons/                # SVG icons
├── docs/                     # Documentation
├── .env.local                # Environment variables
├── vercel.json              # Vercel configuration
└── README.md                # This file
```

---

## 🔧 Configuration

### Program Settings

Configure your affiliate program through the Admin Dashboard:

1. **General Settings**
   - Product name and program name
   - Website URL
   - Currency (INR, USD, EUR, GBP)
   - Blocked countries

2. **Branding**
   - Brand colors (background, button, text)
   - Company logo
   - Favicon

3. **Payout Settings**
   - Minimum payout threshold
   - Payout term (NET-15, NET-30, NET-45)
   - Supported payout methods

4. **Marketing & Tracking**
   - Cookie duration
   - URL parameters
   - Manual lead submission
   - Social media ad blocking

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 👨‍💻 Author

**Developed by: Refferq Team**

- GitHub: [@refferq](https://github.com/refferq)
- Website: [https://refferq.com](https://refferq.com)

---

## 🌟 Show Your Support

If you find this project useful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Submitting pull requests

---

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/refferq/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/refferq/discussions)

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=refferq/refferq&type=date&legend=top-left)](https://www.star-history.com/#refferq/refferq&type=date&legend=top-left)

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)

---
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/I3I31MM8N2)


<p align="center">
  Made with ❤️ by the <strong>Refferq Team</strong>
</p>

<p align="center">
  <sub>© 2025 Refferq. All rights reserved.</sub>
</p>
<p align="center">
 **⭐ Found this useful? Give us a star to support the project!**

  [![Buy Me A Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&slug=daniavila&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://buymeacoffee.com/refferq)
 

### Interface languages

Administrators can select one language for the whole installation in Settings. Add a complete `locales/<locale>.json` file to install another language without rebuilding or restarting. See [Localization](docs/LOCALIZATION.md) for the format, shared database setting and verification commands.
