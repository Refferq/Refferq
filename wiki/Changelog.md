# Changelog

All notable changes to Refferq will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-10-10

### 🎉 Initial Release

The first stable release of Refferq - a comprehensive open-source affiliate management platform.

### ✨ Added

#### Core Features
- **User Authentication**
  - JWT-based authentication system
  - OTP (One-Time Password) email verification
  - Password-less login flow
  - Session management with cookies
  - Secure token refresh mechanism

- **Admin Dashboard**
  - Comprehensive analytics overview
  - Affiliate management (approve, reject, suspend)
  - Referral tracking and approval
  - Commission management
  - Payout processing interface
  - Program settings configuration
  - Batch operations (status changes, deletions)

- **Affiliate Portal**
  - Personal dashboard with earnings overview
  - Referral submission form
  - Referral history and status tracking
  - Commission breakdown
  - Payout history
  - Profile management
  - Unique referral code and links

- **Referral System**
  - Manual referral submission
  - Automatic tracking with referral codes
  - Status workflow (PENDING → APPROVED/REJECTED)
  - Referral details (name, email, company, value)
  - Notes and feedback system

- **Commission System**
  - Flexible commission rules (percentage & fixed)
  - Automatic commission calculation
  - Commission approval workflow
  - Commission history tracking
  - Unpaid/paid status management

- **Payout System**
  - Multiple payout methods (Bank CSV, Stripe Connect)
  - Batch payout processing
  - Payout history tracking
  - Status tracking (PENDING, PROCESSING, COMPLETED, FAILED)
  - Minimum payout thresholds

- **Email Notifications**
  - Welcome emails for new registrations
  - Referral submission notifications to admins
  - Approval/rejection emails to affiliates
  - Payout confirmation emails
  - Password reset emails
  - Email verification
  - Professional HTML templates with Refferq branding

- **User Management**
  - Role-based access (ADMIN, AFFILIATE)
  - Status management (PENDING, ACTIVE, INACTIVE, SUSPENDED)
  - User profile management
  - Account settings
  - Group assignments

#### API Endpoints (31 Total)

**Admin API (18 endpoints)**
- `GET/POST /api/admin/affiliates` - List and manage affiliates
- `PATCH/DELETE /api/admin/affiliates/[id]` - Update/delete individual affiliate
- `POST /api/admin/affiliates/batch` - Batch operations
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/analytics` - Detailed analytics
- `GET /api/admin/reports` - Generate reports
- `GET/POST /api/admin/referrals` - Manage referrals
- `PUT/PATCH/DELETE /api/admin/referrals/[id]` - Update/delete referral
- `GET/POST /api/admin/payouts` - Process payouts
- `GET/PUT /api/admin/settings` - Program settings
- `GET/PUT /api/admin/settings/profile` - Admin profile
- `PUT /api/admin/settings/integration` - Integration settings
- `POST /api/admin/emails/test` - Test email configuration

**Affiliate API (6 endpoints)**
- `GET/POST /api/affiliate/referrals` - Submit and view referrals
- `GET /api/affiliate/payouts` - View payout history
- `GET/PUT /api/affiliate/profile` - Manage profile

**Auth API (7 endpoints)**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-otp` - Send OTP code
- `POST /api/auth/verify-otp` - Verify OTP code

**Webhook API (1 endpoint)**
- `POST /api/webhook/conversion` - External conversion tracking

**Testing API (1 endpoint)**
- `POST /api/test/email` - Email testing

#### Database Schema
- **Users** - User accounts with roles and status
- **Affiliates** - Affiliate profiles with referral codes
- **Referrals** - Tracked referrals with commissions
- **Commissions** - Commission records and calculations
- **Payouts** - Payout history and status
- **AuditLogs** - Activity tracking and auditing
- **ProgramSettings** - Configurable program settings

#### Documentation
- Comprehensive README.md
- API documentation (2000+ lines)
- Deployment guides (Vercel, AWS, Docker)
- Database schema documentation
- Email configuration guide (300+ lines)
- Email implementation guide
- Contributing guidelines
- Code of Conduct
- MIT License

#### Developer Tools
- Email testing script (`npm run test:email`)
- Prisma Studio integration
- TypeScript throughout
- ESLint configuration
- Prettier configuration
- Environment variable templates

#### UI/UX
- Modern, responsive design
- Tailwind CSS styling
- Green branding (#10b981)
- Mobile-friendly interface
- Accessible forms
- Loading states
- Error handling
- Toast notifications

### 🔧 Technical Stack
- **Frontend:** Next.js 15.2.3, React 19, TypeScript 5.8
- **Backend:** Next.js App Router, API Routes
- **Database:** PostgreSQL with Prisma ORM 6.16.3
- **Authentication:** JWT via jose library
- **Email:** Resend API
- **Styling:** Tailwind CSS 3.4
- **Validation:** Zod
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Charts:** Recharts

### 📦 Dependencies
- Production: 28 packages
- Development: 24 packages
- Zero vulnerabilities

### 🚀 Deployment
- Vercel deployment ready
- Docker support
- Environment variable configuration
- Database migration support
- Production build optimization

### 📚 Wiki
- Home page with navigation
- Quick Start Guide (5-minute setup)
- Roadmap with future features
- Changelog (this page)
- FAQ
- Troubleshooting guide

---

## [Unreleased]

Features in development or planned for next release.

### 🔄 In Progress
- Enhanced analytics dashboard
- Webhook system for integrations
- Advanced search and filtering
- Performance monitoring

### 📝 Planned
See our [Roadmap](Roadmap) for upcoming features.

---

## Version History Summary

| Version | Release Date | Highlights |
|---------|--------------|------------|
| 1.0.0 | 2025-10-10 | 🎉 Initial release with core features |

---

## Migration Guides

### From Pre-Release to 1.0.0

No migration needed - this is the first stable release.

---

## Breaking Changes

### Version 1.0.0
- First release - no breaking changes

---

## Deprecations

### Version 1.0.0
- No deprecations in initial release

---

## Security Updates

### Version 1.0.0
- JWT authentication with secure token handling
- Password hashing with bcrypt
- CSRF protection
- XSS prevention
- SQL injection prevention via Prisma
- Rate limiting recommended for production

---

## Known Issues

### Version 1.0.0

**Minor Issues:**
- Email delivery may be slow with free Resend tier
- Prisma Studio requires manual start
- No automatic session refresh (manual re-login required)

**Workarounds:**
- Upgrade Resend plan for faster delivery
- Use `npx prisma studio` command
- Set longer JWT expiration times

**Planned Fixes:**
- Automatic session refresh (v1.1.0)
- Integrated Prisma Studio (v1.2.0)
- Email queue system (v1.3.0)

---

## Contributors

### Version 1.0.0

Special thanks to everyone who contributed to the initial release:

- **Refferq Team** - Core development
- **Community** - Testing and feedback

Want to contribute? See our [Contributing Guide](Contributing).

---

## Release Notes Format

Each release includes:

### Added ✨
New features and functionality

### Changed 🔄
Changes to existing features

### Deprecated ⚠️
Features marked for removal

### Removed 🗑️
Removed features

### Fixed 🐛
Bug fixes

### Security 🔒
Security improvements

---

## Semantic Versioning

Refferq follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0) - Breaking changes
- **MINOR** (1.X.0) - New features (backwards compatible)
- **PATCH** (1.0.X) - Bug fixes (backwards compatible)

---

## Release Schedule

- **Patch Releases:** As needed (bug fixes)
- **Minor Releases:** Quarterly (new features)
- **Major Releases:** Annually (breaking changes)

---

## Getting Updates

Stay informed about new releases:

- **[GitHub Releases](https://github.com/refferq/refferq/releases)** - Official releases
- **[GitHub Watch](https://github.com/refferq/refferq)** - Get notifications
- **[Roadmap](Roadmap)** - See what's coming
- **Email:** hello@refferq.com - Contact for updates

---

## Version Support

| Version | Status | Support Until |
|---------|--------|---------------|
| 1.0.x | Current | Ongoing |

### Support Policy
- **Current Version:** Full support with updates
- **Previous Minor:** Security updates only (6 months)
- **Older Versions:** No support (upgrade recommended)

---

<p align="center">
  <strong>Have feedback on a release?</strong><br>
  Share it in <a href="https://github.com/refferq/refferq/discussions">GitHub Discussions</a>
</p>

<p align="center">
  Last Updated: October 10, 2025
</p>
