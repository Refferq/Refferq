# Database Migration: Partner Group Relation

## 📋 Overview

Added proper foreign key relationship between `Affiliate` and `PartnerGroup` models to enable commission rates based on partner group membership.

**Date:** October 13, 2025  
**Status:** ✅ Applied Successfully  
**Method:** `prisma db push` (direct schema sync)

---

## 🔄 Schema Changes

### Before:
```prisma
model Affiliate {
  id            String       @id @default(cuid())
  userId        String       @unique @map("user_id")
  referralCode  String       @unique @map("referral_code")
  payoutDetails Json         @default("{}") @map("payout_details")  // ← Stored partner group in JSON
  balanceCents  Int          @default(0) @map("balance_cents")
  // ... other fields
}

model PartnerGroup {
  id             String   @id @default(cuid())
  name           String
  commissionRate Float    @map("commission_rate")
  // ... other fields
  // ❌ No relation to Affiliate
}
```

### After:
```prisma
model Affiliate {
  id             String        @id @default(cuid())
  userId         String        @unique @map("user_id")
  referralCode   String        @unique @map("referral_code")
  partnerGroupId String?       @map("partner_group_id")  // ← NEW: Foreign key
  payoutDetails  Json          @default("{}") @map("payout_details")
  balanceCents   Int           @default(0) @map("balance_cents")
  // ... other fields
  partnerGroup   PartnerGroup? @relation(fields: [partnerGroupId], references: [id], onDelete: SetNull)  // ← NEW: Relation
}

model PartnerGroup {
  id             String      @id @default(cuid())
  name           String
  commissionRate Float       @map("commission_rate")
  // ... other fields
  affiliates     Affiliate[] // ← NEW: Reverse relation
}
```

---

## 📊 Database Changes

### Table: `affiliates`

**New Column Added:**
```sql
ALTER TABLE affiliates 
ADD COLUMN partner_group_id TEXT;

ALTER TABLE affiliates
ADD CONSTRAINT affiliates_partner_group_id_fkey 
FOREIGN KEY (partner_group_id) 
REFERENCES partner_groups(id) 
ON DELETE SET NULL;
```

**Properties:**
- **Column Name:** `partner_group_id`
- **Type:** `TEXT` (varchar/string in Postgres)
- **Nullable:** `YES` (optional relationship)
- **Foreign Key:** References `partner_groups(id)`
- **On Delete:** `SET NULL` (if partner group deleted, affiliate remains but partnerGroupId becomes null)

---

## 🎯 Why This Change?

### Problem:
Before this change, commission rates were:
1. ❌ **Hardcoded** at 20% in the code
2. ❌ Partner group info stored in **JSON field** (`payoutDetails.partnerGroup`)
3. ❌ No database-level integrity
4. ❌ Couldn't query affiliates by partner group efficiently
5. ❌ Had to fetch all partner groups and match manually

### Solution:
After this change:
1. ✅ Commission rates stored in `PartnerGroup.commissionRate`
2. ✅ Proper **foreign key relationship**
3. ✅ Database enforces referential integrity
4. ✅ Can use Prisma's `include` to get partner group with affiliate
5. ✅ Efficient queries: `affiliate.partnerGroup.commissionRate`

---

## 🔍 Data Impact

### Existing Data:
- ✅ **All existing affiliates preserved**
- ✅ `partner_group_id` set to `NULL` for all existing affiliates
- ✅ `payoutDetails` JSON field remains unchanged (backward compatibility)
- ✅ No data loss

### Next Steps for Data Migration:
If you have existing affiliates with partner groups in `payoutDetails`, you need to migrate them:

```typescript
// Migration script (run once)
const affiliates = await prisma.affiliate.findMany({
  select: {
    id: true,
    payoutDetails: true
  }
});

for (const affiliate of affiliates) {
  const payoutDetails = affiliate.payoutDetails as any;
  const partnerGroupName = payoutDetails?.partnerGroup;
  
  if (partnerGroupName) {
    // Find the partner group by name
    const partnerGroup = await prisma.partnerGroup.findFirst({
      where: { name: partnerGroupName }
    });
    
    if (partnerGroup) {
      // Update affiliate with partner group ID
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { partnerGroupId: partnerGroup.id }
      });
    }
  }
}
```

---

## 📝 Code Changes Required

### API Endpoints to Update:

#### 1. **GET /api/admin/referrals**
```typescript
// Before:
const referrals = await prisma.referral.findMany({
  include: {
    affiliate: {
      include: { user: true }
    }
  }
});

// After: Add partnerGroup include
const referrals = await prisma.referral.findMany({
  include: {
    affiliate: {
      include: { 
        user: true,
        partnerGroup: true  // ← NEW: Include partner group
      }
    }
  }
});

// Then extract commission rate:
const commissionRate = referral.affiliate.partnerGroup?.commissionRate || 0.20;
```

#### 2. **Admin Dashboard - fetchCustomers()**
```typescript
// In src/app/admin/page.tsx
const data = await response.json();

data.referrals.map((ref: any) => {
  const estimatedValue = Number(ref.estimatedValue) || 0;
  const valueInCents = estimatedValue * 100;
  
  // ✅ NOW: Use partner group's commission rate
  const commissionRate = ref.affiliate?.partnerGroup?.commissionRate || 0.20;
  const commissionInCents = Math.floor(valueInCents * commissionRate);
  
  // ...
});
```

#### 3. **Partner Management**
When admin assigns partner to a group:
```typescript
await prisma.affiliate.update({
  where: { id: affiliateId },
  data: {
    partnerGroupId: partnerGroupId  // ← Set the foreign key
  }
});
```

---

## ✅ Verification Steps

### 1. Check Schema Sync:
```bash
npx prisma db pull  # Pull schema from database
npx prisma generate # Regenerate Prisma Client
```

### 2. Test in Database:
```sql
-- Check new column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'affiliates' 
AND column_name = 'partner_group_id';

-- Check foreign key constraint
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'affiliates' 
AND column_name = 'partner_group_id';
```

### 3. Test in Code:
```typescript
// Test query
const affiliate = await prisma.affiliate.findUnique({
  where: { id: 'some-id' },
  include: {
    partnerGroup: true  // ← Should work now
  }
});

console.log(affiliate.partnerGroup?.commissionRate); // Should show commission rate
```

---

## 🎯 Benefits

### Performance:
- ✅ **Single query** to get affiliate with partner group (no manual matching)
- ✅ **Database indexes** can be used for partner group lookups
- ✅ **Join operations** handled efficiently by PostgreSQL

### Data Integrity:
- ✅ **Foreign key constraint** ensures partner group exists
- ✅ **Cascading rules** handle deletions properly
- ✅ **Type safety** with Prisma TypeScript types

### Developer Experience:
- ✅ **Autocomplete** for `affiliate.partnerGroup.commissionRate`
- ✅ **Type checking** prevents errors
- ✅ **Clear relationships** in schema documentation

### Business Logic:
- ✅ **Dynamic commission rates** per partner group
- ✅ **Easy to query** affiliates by partner group
- ✅ **Scalable** for multiple partner group tiers

---

## 🚨 Rollback Plan

If you need to rollback:

```sql
-- Remove foreign key constraint
ALTER TABLE affiliates 
DROP CONSTRAINT IF EXISTS affiliates_partner_group_id_fkey;

-- Remove column
ALTER TABLE affiliates 
DROP COLUMN IF EXISTS partner_group_id;
```

Then revert schema.prisma and run:
```bash
npx prisma generate
```

---

## 📚 Related Documentation

- **Schema File:** `prisma/schema.prisma`
- **Feature Doc:** `FEATURE_ADMIN_ESTIMATED_AMOUNT_COMMISSION.md`
- **Commission Implementation:** `src/app/admin/page.tsx` (fetchCustomers function)
- **API Endpoints:** `src/app/api/admin/referrals/route.ts`

---

**Migration Status:** ✅ Complete  
**Database Impact:** Low (new column, existing data unchanged)  
**Backward Compatible:** Yes (column is nullable)  
**Testing Required:** Yes (verify commission calculations work)
