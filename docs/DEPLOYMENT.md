# Deploying Refferq to Vercel

**Author: Refferq Team**

Complete guide for deploying Refferq to Vercel with PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- PostgreSQL database (see database options below)

---

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Refferq by Refferq Team"
git branch -M main
git remote add origin https://github.com/yourusername/refferq.git
git push -u origin main
```

### 1.2 Verify Required Files

Ensure these files exist:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.example` - Environment template
- ✅ `prisma/schema.prisma` - Database schema
- ✅ `package.json` - Dependencies

---

## Step 2: Set Up Database

Choose one of these PostgreSQL hosting options:

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Choose your region
5. Copy the connection string

### Option B: Neon (Free Tier)

1. Go to [Neon.tech](https://neon.tech)
2. Create account and project
3. Copy connection string
4. Format: `postgresql://user:pass@host/db?sslmode=require`

### Option C: Supabase

1. Go to [Supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy "Connection string"
5. Replace `[YOUR-PASSWORD]` with actual password

### Option D: Railway

1. Go to [Railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Copy connection string from "Connect" tab

---

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository

### 3.2 Configure Build Settings

Vercel auto-detects Next.js. Verify these settings:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3.3 Add Environment Variables

Click "Environment Variables" and add:

```env
# Required Variables
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Refferq <noreply@refferq.com>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional: Payment Integration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**For Gmail:**
- Use App-Specific Password
- Enable 2FA first
- Create app password: https://myaccount.google.com/apppasswords

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Get your deployment URL: `https://your-project.vercel.app`

---

## Step 4: Initialize Database

### 4.1 Run Prisma Migrations

After deployment, you need to push the schema:

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run Prisma commands
vercel env pull .env.local
npx prisma generate
npx prisma db push
```

**Option B: GitHub Actions**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npx prisma generate
      - run: npx prisma db push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Add `DATABASE_URL` to GitHub Secrets.

---

## Step 5: Create Admin Account

### 5.1 Using Database Client

Connect to your database and run:

```sql
-- Insert admin user
INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
VALUES (
  'admin_' || gen_random_uuid()::text,
  'admin@refferq.com',
  'Admin User',
  '$2a$10$hashed_password_here', -- Use bcrypt hash
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

**Generate bcrypt hash:**
```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

### 5.2 Using API (After First Deploy)

1. Register normally at `/register`
2. Update role in database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain: `refferq.com`
3. Add subdomain: `app.refferq.com`

### 6.2 Update DNS Records

Add these records to your DNS provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 Update Environment Variables

Update `NEXT_PUBLIC_APP_URL`:

```env
NEXT_PUBLIC_APP_URL=https://refferq.com
```

---

## Step 7: Post-Deployment Checklist

- [ ] Database connected and schema pushed
- [ ] Admin account created
- [ ] Environment variables set
- [ ] Email sending works
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Test affiliate registration
- [ ] Test referral submission
- [ ] Test admin approval workflow
- [ ] Monitor error logs in Vercel dashboard

---

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**

Solution: Add to `vercel.json`:
```json
{
  "buildCommand": "npx prisma generate && npm run build"
}
```

**Error: Database connection failed**

- Check DATABASE_URL format
- Ensure database allows external connections
- Verify SSL mode if required: `?sslmode=require`

### Runtime Errors

**Error: JWT verification failed**

- Ensure JWT_SECRET is set
- Must be same across all deployments
- Minimum 32 characters

**Error: Email sending failed**

- Verify EMAIL_HOST and EMAIL_PORT
- Check EMAIL_USER and EMAIL_PASSWORD
- For Gmail: Use App-Specific Password

### Database Issues

**Error: Table doesn't exist**

Run:
```bash
npx prisma db push --force-reset
```

**Error: Connection pool exhausted**

- Upgrade database plan
- Reduce connection pool size in DATABASE_URL:
  ```
  ?connection_limit=5&pool_timeout=10
  ```

---

## Monitoring & Maintenance

### View Logs

```bash
vercel logs
```

Or check Vercel Dashboard → Deployments → View Function Logs

### Update Deployment

```bash
git add .
git commit -m "Update"
git push origin main
```

Vercel auto-deploys on push to main branch.

### Rollback

In Vercel Dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Performance Optimization

### 1. Enable Caching

Add to `next.config.ts`:
```typescript
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 's-maxage=60, stale-while-revalidate' }
      ]
    }
  ]
}
```

### 2. Database Connection Pooling

Use connection pooling for serverless:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5&pool_timeout=10'
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Enable Edge Functions

For better performance, consider Edge Runtime for API routes:

```typescript
export const runtime = 'edge';
```

---

## Security Checklist

- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Enable SSL/HTTPS (automatic on Vercel)
- [ ] Set secure environment variables
- [ ] Never commit .env.local
- [ ] Use database connection pooling
- [ ] Enable rate limiting (consider Vercel Edge Middleware)
- [ ] Regular security updates: `npm audit`

---

## Support

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/refferq/refferq/issues)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

**Deployment Guide by Refferq Team**

*Last Updated: October 2025*
