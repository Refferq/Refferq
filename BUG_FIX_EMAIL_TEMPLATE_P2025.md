# Bug Fix: Email Template Update Error (P2025)

## 🐛 Error Message
```
Error saving email template: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.emailTemplate.update()` invocation:

An operation failed because it depends on one or more records that were required but not found. 
No record was found for an update.

code: 'P2025'
```

## 🔍 Root Cause

The error occurs when trying to **update** an email template that doesn't exist in the database yet.

### Why This Happens:
1. Admin opens email templates page
2. Frontend sends template data with an `id` field
3. API tries to update that template using `prisma.emailTemplate.update()`
4. But the template with that ID doesn't exist in database yet
5. Prisma throws P2025 error: "Record not found"

### Scenario:
- Fresh database installation
- Email templates table is empty
- Admin tries to edit/save a template
- API assumes template exists → **FAILS**

---

## ✅ The Fix

**File:** `src/app/api/admin/emails/route.ts`

### Before (Buggy):
```typescript
if (id) {
  // Update existing template
  template = await prisma.emailTemplate.update({
    where: { id },
    data: { ... }
  });
  // ❌ Throws error if template doesn't exist
}
```

### After (Fixed):
```typescript
if (id) {
  // Check if template exists first
  const existingTemplate = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (existingTemplate) {
    // Template exists, update it ✅
    template = await prisma.emailTemplate.update({
      where: { id },
      data: { ... }
    });
  } else {
    // Template not found, create new one instead ✅
    template = await prisma.emailTemplate.create({
      data: { ... }
    });
  }
}
```

### What This Does:
1. ✅ Checks if template exists before updating
2. ✅ If exists → Updates the template
3. ✅ If not exists → Creates new template instead
4. ✅ No more P2025 errors!

---

## 🎯 Alternative Solutions

### Option 1: Use Prisma Upsert (Recommended)
Replace the entire if/else block with upsert:

```typescript
if (id) {
  // Upsert: Update if exists, create if not
  template = await prisma.emailTemplate.upsert({
    where: { id },
    update: {
      subject,
      body: emailBody,
      variables: variables || [],
      updatedAt: new Date(),
    },
    create: {
      type,
      name,
      subject,
      body: emailBody,
      variables: variables || [],
      isActive: true,
    },
  });
}
```

**Pros:**
- Single database query (faster)
- Cleaner code
- Atomic operation

**Cons:**
- Requires both update and create data

### Option 2: Use Try-Catch
Catch the P2025 error and create instead:

```typescript
if (id) {
  try {
    template = await prisma.emailTemplate.update({
      where: { id },
      data: { ... }
    });
  } catch (error) {
    if (error.code === 'P2025') {
      // Template not found, create new one
      template = await prisma.emailTemplate.create({
        data: { ... }
      });
    } else {
      throw error;
    }
  }
}
```

**Pros:**
- Handles the error gracefully
- Clear error handling

**Cons:**
- Using exceptions for control flow (not ideal)
- Requires catching and re-throwing

---

## 🗃️ Database Setup

### Check If Email Templates Exist

```sql
-- Check email templates table
SELECT * FROM email_templates;

-- Count email templates
SELECT COUNT(*) as template_count FROM email_templates;
```

### Seed Email Templates (Optional)

Create default email templates in database:

```sql
-- Insert default email templates
INSERT INTO email_templates (id, type, name, subject, body, variables, is_active, created_at, updated_at)
VALUES
  ('welcome_email_template', 'WELCOME_EMAIL', 'Welcome Email', 
   'Welcome to {{platform_name}}!', 
   '<p>Hi {{user_name}},</p><p>Welcome to our affiliate platform!</p>', 
   '["platform_name", "user_name"]', 
   true, NOW(), NOW()),
   
  ('first_referral', 'FIRST_REFERRAL', 'First Referral Notification', 
   'Congratulations on your first referral!', 
   '<p>Great job {{partner_name}}! You just got your first referral.</p>', 
   '["partner_name"]', 
   true, NOW(), NOW()),
   
  ('partner_approval', 'PARTNER_APPROVAL', 'Partner Approval Email', 
   'Your affiliate account has been approved', 
   '<p>Hi {{partner_name}},</p><p>Your affiliate account has been approved!</p>', 
   '["partner_name"]', 
   true, NOW(), NOW());
```

---

## 🧪 Testing Steps

### 1. Test Creating New Template
1. Login as admin
2. Go to Email Templates page
3. Click "Create New Template"
4. Fill in all fields
5. Click Save
6. **Expected:** Template created successfully ✅

### 2. Test Updating Existing Template
1. Open an existing template
2. Modify subject or body
3. Click Save
4. **Expected:** Template updated successfully ✅

### 3. Test Updating Non-Existent Template (Edge Case)
1. Frontend sends ID that doesn't exist in DB
2. API checks if template exists
3. Template not found → Creates new template instead
4. **Expected:** No P2025 error, new template created ✅

### 4. Test Template List
1. Go to Email Templates page
2. **Expected:** All templates display correctly ✅
3. **Expected:** No console errors ✅

---

## 📋 Available Email Template Types

From `prisma/schema.prisma`:

```typescript
enum EmailTemplateType {
  WELCOME_EMAIL          // Sent when user registers
  FIRST_REFERRAL         // First referral notification
  NEW_REFERRAL           // New referral received
  PARTNER_PAID           // Partner payout notification
  PARTNER_INVITATION     // Invite to become partner
  PARTNER_APPROVAL       // Partner account approved
  PARTNER_DECLINED       // Partner account declined
  COMMISSION_APPROVED    // Commission approved
  PAYOUT_GENERATED       // Payout generated
  REFERRAL_CONVERTED     // Referral converted to customer
}
```

---

## 🚨 Common Issues

### Issue 1: Template Still Not Saving
**Symptom:** Even after fix, template doesn't save

**Solution:**
- Check browser console for errors
- Verify `type`, `name`, `subject`, `body` are all provided
- Check database connection
- Verify admin user is authenticated

### Issue 2: Variables Not Working
**Symptom:** Email variables like `{{user_name}}` not replaced

**Solution:**
- Ensure variables are stored as JSON array: `["user_name", "platform_name"]`
- Check email sending service is replacing variables
- Verify variable names match in template and email service

### Issue 3: Templates Not Appearing
**Symptom:** Template created but not showing in list

**Solution:**
- Refresh the page
- Check GET endpoint returns templates
- Verify database actually has the record:
  ```sql
  SELECT * FROM email_templates ORDER BY created_at DESC;
  ```

---

## 🔧 Database Migration

If you need to reset email templates:

```sql
-- Delete all email templates (be careful!)
DELETE FROM email_templates;

-- Or delete specific template
DELETE FROM email_templates WHERE id = 'template_id_here';

-- Check what's left
SELECT id, type, name, subject FROM email_templates;
```

---

## 💡 Prevention Tips

### For Future Development:

1. **Always check if record exists before updating:**
   ```typescript
   const exists = await prisma.model.findUnique({ where: { id } });
   if (exists) {
     // Update
   } else {
     // Handle not found
   }
   ```

2. **Use upsert for create-or-update operations:**
   ```typescript
   await prisma.model.upsert({
     where: { id },
     update: { ... },
     create: { ... }
   });
   ```

3. **Handle Prisma errors specifically:**
   ```typescript
   catch (error) {
     if (error.code === 'P2025') {
       // Record not found
     } else if (error.code === 'P2002') {
       // Unique constraint violation
     }
   }
   ```

4. **Seed default data:**
   - Create seed script for email templates
   - Run seed after database migrations
   - Provide default templates for common use cases

---

## 📊 Impact

- **Severity:** MEDIUM (Blocks email template management)
- **Users Affected:** Admin users managing email templates
- **Data Loss:** None (no data was lost)
- **Fix Complexity:** LOW (Simple existence check)
- **Testing Required:** MEDIUM (Test create, update, edge cases)

---

## ✅ Verification Checklist

- [x] Fixed: Added existence check before update
- [ ] Tested: Create new template
- [ ] Tested: Update existing template
- [ ] Tested: Edge case (non-existent ID)
- [ ] Verified: No P2025 errors in logs
- [ ] Confirmed: All templates display correctly

---

**Fixed By:** GitHub Copilot  
**Date:** 2025-10-13  
**Status:** ✅ Fixed - Ready for testing  
**Risk Level:** LOW (Safe fallback logic)

---

## 🚀 Deploy

```powershell
# Commit the fix
git add .
git commit -m "fix: Handle non-existent email templates gracefully (P2025)"

# Push to repository
git push origin main

# No database migration needed - code fix only
```
