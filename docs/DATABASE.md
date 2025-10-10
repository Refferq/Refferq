# Database Schema Documentation

**Author: Refferq Team**

Complete reference for Refferq's PostgreSQL database schema using Prisma ORM.

## Overview

Refferq uses PostgreSQL with Prisma ORM for type-safe database access. The schema is designed for a multi-tenant affiliate marketing platform.

**Schema Location**: `prisma/schema.prisma`

---

## Models Overview

```
User (Admins & Affiliates)
├── Affiliate (1:1) - Extended profile for affiliates
│   ├── Referral (1:N) - Leads generated
│   │   └── Commission (1:1) - Earnings from approved leads
│   └── Payout (1:N) - Payment history
│
└── ProgramSettings (N:1) - Platform configuration
```

---

## User Model

Core authentication and user management.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  role          Role      @default(AFFILIATE)
  status        UserStatus @default(PENDING)
  lastLogin     DateTime?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  affiliate     Affiliate?
}
```

### Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `id` | String | Unique user identifier (cuid) | Auto-generated |
| `email` | String | Email address (unique) | Required |
| `name` | String? | Display name | Nullable |
| `password` | String | Bcrypt hashed password | Required |
| `role` | Role | User role: ADMIN or AFFILIATE | AFFILIATE |
| `status` | UserStatus | Account status | PENDING |
| `lastLogin` | DateTime? | Last login timestamp | Nullable |
| `emailVerified` | Boolean | Email verification status | false |
| `createdAt` | DateTime | Account creation date | Auto |
| `updatedAt` | DateTime | Last update timestamp | Auto |

### Enums

**Role**
```prisma
enum Role {
  ADMIN      // Full platform access
  AFFILIATE  // Limited to own data
}
```

**UserStatus**
```prisma
enum UserStatus {
  PENDING   // Awaiting admin approval
  ACTIVE    // Can access platform
  SUSPENDED // Temporarily disabled
  BANNED    // Permanently disabled
}
```

### Relations

- `affiliate` (1:1) → Affiliate profile for AFFILIATE role

---

## Affiliate Model

Extended profile for affiliate users.

```prisma
model Affiliate {
  id            String    @id @default(cuid())
  userId        String    @unique
  company       String?
  country       String?
  totalEarnings Float     @default(0)
  pendingPayout Float     @default(0)
  referralCode  String    @unique
  payoutDetails Json?     // { paymentMethod, paymentEmail }
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  referrals     Referral[]
  payouts       Payout[]
}
```

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique affiliate ID | cuid() |
| `userId` | String | Foreign key to User | User.id |
| `company` | String? | Company/website name | "Tech Blog Inc" |
| `country` | String? | Country code | "US" |
| `totalEarnings` | Float | All-time earnings | 1250.50 |
| `pendingPayout` | Float | Unpaid commissions | 150.00 |
| `referralCode` | String | Unique tracking code | "AFF123XYZ" |
| `payoutDetails` | Json? | Payment method data | See below |
| `createdAt` | DateTime | Registration date | Auto |
| `updatedAt` | DateTime | Last profile update | Auto |

### Payout Details JSON Structure

```json
{
  "paymentMethod": "paypal",
  "paymentEmail": "affiliate@example.com",
  "bankName": "Optional Bank Name",
  "accountNumber": "Optional Account Number"
}
```

### Relations

- `user` (N:1) → User record (CASCADE delete)
- `referrals` (1:N) → Generated leads
- `payouts` (1:N) → Payment history

### Indexes

- `userId` (unique)
- `referralCode` (unique)

---

## Referral Model

Tracks leads submitted by affiliates.

```prisma
model Referral {
  id            String         @id @default(cuid())
  affiliateId   String
  customerName  String
  customerEmail String
  customerPhone String?
  status        ReferralStatus @default(PENDING)
  revenue       Float?
  notes         String?
  submittedAt   DateTime       @default(now())
  reviewedAt    DateTime?
  reviewedBy    String?        // Admin user ID
  
  affiliate     Affiliate      @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  commission    Commission?
}
```

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique referral ID | cuid() |
| `affiliateId` | String | Foreign key to Affiliate | Affiliate.id |
| `customerName` | String | Lead's full name | "John Doe" |
| `customerEmail` | String | Lead's email | "john@example.com" |
| `customerPhone` | String? | Lead's phone | "+1234567890" |
| `status` | ReferralStatus | Processing status | PENDING |
| `revenue` | Float? | Sale amount (optional) | 99.99 |
| `notes` | String? | Admin notes | "High value lead" |
| `submittedAt` | DateTime | Submission timestamp | Auto |
| `reviewedAt` | DateTime? | Review timestamp | Nullable |
| `reviewedBy` | String? | Admin user ID | User.id |

### Enums

**ReferralStatus**
```prisma
enum ReferralStatus {
  PENDING   // Awaiting admin review
  APPROVED  // Commission created
  REJECTED  // Did not qualify
}
```

### Relations

- `affiliate` (N:1) → Affiliate who submitted (CASCADE delete)
- `commission` (1:1) → Commission if approved

### Indexes

- `affiliateId`
- `status`
- `customerEmail` (for duplicate checking)

---

## Commission Model

Earnings from approved referrals.

```prisma
model Commission {
  id              String           @id @default(cuid())
  referralId      String           @unique
  affiliateId     String
  amount          Float
  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?
  payoutId        String?
  createdAt       DateTime         @default(now())
  
  referral        Referral         @relation(fields: [referralId], references: [id], onDelete: Cascade)
  payout          Payout?          @relation(fields: [payoutId], references: [id])
}
```

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique commission ID | cuid() |
| `referralId` | String | Foreign key to Referral | Referral.id |
| `affiliateId` | String | Affiliate owner | Affiliate.id |
| `amount` | Float | Commission amount | 25.00 |
| `status` | CommissionStatus | Payment status | PENDING |
| `paidAt` | DateTime? | Payment timestamp | Nullable |
| `payoutId` | String? | Associated payout | Payout.id |
| `createdAt` | DateTime | Commission created | Auto |

### Enums

**CommissionStatus**
```prisma
enum CommissionStatus {
  PENDING   // Unpaid, accruing
  PAID      // Included in payout
  CANCELLED // Refunded or invalid
}
```

### Relations

- `referral` (N:1) → Source referral (CASCADE delete)
- `payout` (N:1) → Payment batch (optional)

### Indexes

- `referralId` (unique)
- `affiliateId`
- `status`

---

## Payout Model

Payment batches to affiliates.

```prisma
model Payout {
  id            String       @id @default(cuid())
  affiliateId   String
  amount        Float
  status        PayoutStatus @default(PENDING)
  method        String?      // paypal, bank_transfer, etc.
  reference     String?      // Transaction ID
  paidAt        DateTime?
  createdAt     DateTime     @default(now())
  
  affiliate     Affiliate    @relation(fields: [affiliateId], references: [id], onDelete: Cascade)
  commissions   Commission[]
}
```

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | String | Unique payout ID | cuid() |
| `affiliateId` | String | Recipient affiliate | Affiliate.id |
| `amount` | Float | Total payout amount | 150.00 |
| `status` | PayoutStatus | Payment status | PENDING |
| `method` | String? | Payment method | "paypal" |
| `reference` | String? | External transaction ID | "TXN123456" |
| `paidAt` | DateTime? | Payment completion | Nullable |
| `createdAt` | DateTime | Payout created | Auto |

### Enums

**PayoutStatus**
```prisma
enum PayoutStatus {
  PENDING    // Awaiting processing
  PROCESSING // Payment in progress
  COMPLETED  // Successfully paid
  FAILED     // Payment failed
}
```

### Relations

- `affiliate` (N:1) → Recipient (CASCADE delete)
- `commissions` (1:N) → Included commissions

### Indexes

- `affiliateId`
- `status`

---

## ProgramSettings Model

Platform-wide configuration.

```prisma
model ProgramSettings {
  id                    String   @id @default(cuid())
  productName           String   @default("Product Name")
  programName           String   @default("Affiliate Program")
  websiteUrl            String   @default("https://example.com")
  subdomain             String?
  currency              String   @default("USD")
  cookieDuration        Int      @default(30)  // days
  payoutThreshold       Float    @default(50.0)
  payoutTerm            String   @default("monthly")
  termsOfService        String?
  allowSelfReferrals    Boolean  @default(false)
  requireApproval       Boolean  @default(true)
  autoApproveAffiliates Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### Fields

| Field | Type | Description | Default | Example |
|-------|------|-------------|---------|---------|
| `id` | String | Settings ID | cuid() | - |
| `productName` | String | Product/service name | "Product Name" | "Refferq" |
| `programName` | String | Program display name | "Affiliate Program" | "Refferq Partners" |
| `websiteUrl` | String | Main website URL | "https://example.com" | "https://refferq.com" |
| `subdomain` | String? | Custom subdomain | null | "affiliates" |
| `currency` | String | Currency code | "USD" | "USD", "EUR" |
| `cookieDuration` | Int | Tracking cookie days | 30 | 60 |
| `payoutThreshold` | Float | Minimum payout | 50.0 | 100.0 |
| `payoutTerm` | String | Payout frequency | "monthly" | "monthly", "weekly" |
| `termsOfService` | String? | ToS URL or text | null | "https://..." |
| `allowSelfReferrals` | Boolean | Allow self-referrals | false | true |
| `requireApproval` | Boolean | Admin approval needed | true | true |
| `autoApproveAffiliates` | Boolean | Auto-activate users | false | false |
| `createdAt` | DateTime | Settings created | Auto | - |
| `updatedAt` | DateTime | Last updated | Auto | - |

### Usage

Typically one record exists globally:

```typescript
// Fetch or create settings
const settings = await prisma.programSettings.findFirst() || 
  await prisma.programSettings.create({ data: {} });
```

---

## Prisma Client Usage

### Initialize Client

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export default prisma
```

### Query Examples

**Create Affiliate**
```typescript
const affiliate = await prisma.affiliate.create({
  data: {
    userId: user.id,
    referralCode: generateCode(),
    payoutDetails: {
      paymentMethod: 'paypal',
      paymentEmail: 'affiliate@example.com'
    }
  }
})
```

**Find Referrals with Relations**
```typescript
const referrals = await prisma.referral.findMany({
  where: { affiliateId: 'xyz' },
  include: {
    affiliate: { include: { user: true } },
    commission: true
  },
  orderBy: { submittedAt: 'desc' }
})
```

**Update Commission Status**
```typescript
await prisma.commission.updateMany({
  where: { payoutId: 'abc' },
  data: { status: 'PAID', paidAt: new Date() }
})
```

**Aggregate Earnings**
```typescript
const stats = await prisma.commission.aggregate({
  where: { affiliateId: 'xyz', status: 'PAID' },
  _sum: { amount: true }
})
```

---

## Migrations

### Development

```bash
# Create migration
npx prisma migrate dev --name add_field

# Reset database
npx prisma migrate reset
```

### Production

```bash
# Push schema without migration
npx prisma db push

# Or apply migrations
npx prisma migrate deploy
```

### Generate Client

```bash
npx prisma generate
```

---

## Database Seeding

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@refferq.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true
    }
  })

  // Create default settings
  await prisma.programSettings.create({
    data: {
      productName: 'Refferq',
      programName: 'Refferq Partners',
      websiteUrl: 'https://refferq.com',
      currency: 'USD',
      payoutThreshold: 50.0
    }
  })

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run seed:
```bash
npx prisma db seed
```

---

## Backup & Restore

### Backup

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restore

```bash
psql $DATABASE_URL < backup.sql
```

---

## Performance Tips

### 1. Use Indexes

Already defined in schema:
- `userId` on Affiliate
- `referralCode` on Affiliate
- `affiliateId` on Referral
- `referralId` on Commission

### 2. Connection Pooling

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=5'
    }
  }
})
```

### 3. Select Only Needed Fields

```typescript
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true }
})
```

### 4. Use Transactions

```typescript
await prisma.$transaction([
  prisma.referral.update({ ... }),
  prisma.commission.create({ ... }),
  prisma.affiliate.update({ ... })
])
```

---

## Common Queries

### Dashboard Stats

```typescript
const stats = await prisma.$transaction([
  prisma.affiliate.count({ where: { user: { status: 'ACTIVE' } } }),
  prisma.referral.count({ where: { status: 'PENDING' } }),
  prisma.commission.aggregate({
    where: { status: 'PAID' },
    _sum: { amount: true }
  })
])
```

### Top Affiliates

```typescript
const topAffiliates = await prisma.affiliate.findMany({
  orderBy: { totalEarnings: 'desc' },
  take: 10,
  include: { user: { select: { name: true, email: true } } }
})
```

### Recent Activity

```typescript
const activity = await prisma.referral.findMany({
  orderBy: { submittedAt: 'desc' },
  take: 20,
  include: {
    affiliate: { include: { user: true } }
  }
})
```

---

## Troubleshooting

### Connection Issues

Check connection string format:
```
postgresql://user:password@host:5432/database?sslmode=require
```

### Schema Out of Sync

```bash
npx prisma db push --force-reset
npx prisma generate
```

### Migration Conflicts

```bash
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy
```

---

## Support

- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **PostgreSQL Docs**: [postgresql.org/docs](https://www.postgresql.org/docs/)

---

**Database Documentation by Refferq Team**

*Last Updated: October 2025*
