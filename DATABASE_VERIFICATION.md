# Database Verification Script

## Check Affiliate Registration Status

Use this SQL query to verify that newly registered affiliates have PENDING status:

```sql
-- Check all users and their status
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  u.created_at,
  a.referral_code
FROM users u
LEFT JOIN affiliates a ON u.id = a.user_id
WHERE u.role = 'AFFILIATE'
ORDER BY u.created_at DESC
LIMIT 20;
```

## Expected Results

### For Newly Registered Affiliates
- `role` should be: **AFFILIATE**
- `status` should be: **PENDING** ← This is the key!
- `referral_code` should exist in affiliates table

### Example Output
```
| id   | name        | email              | role      | status  | created_at          | referral_code |
|------|-------------|--------------------|-----------|---------|--------------------|---------------|
| c123 | John Doe    | john@example.com   | AFFILIATE | PENDING | 2025-01-24 10:30:00| ABC123XYZ     |
| c124 | Jane Smith  | jane@example.com   | AFFILIATE | PENDING | 2025-01-24 11:15:00| DEF456UVW     |
```

## Test the Fix

### Step 1: Register a New Affiliate
```bash
# Use the registration form or API
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "role": "AFFILIATE"
}
```

### Step 2: Verify Database
Run the SQL query above and confirm:
- ✅ New user exists with role = 'AFFILIATE'
- ✅ Status = 'PENDING'
- ✅ Affiliate record created with referral_code

### Step 3: Check Admin Panel
1. Login as admin
2. Go to Partners page
3. Click "Pending" tab
4. ✅ **The new affiliate should appear in the list**

### Step 4: Test Login
1. Try to login with the pending affiliate account
2. ✅ Should see: "Your account is pending approval. Please wait for admin activation."

### Step 5: Approve Affiliate
1. As admin, click on the pending affiliate
2. Update status to ACTIVE
3. ✅ Affiliate should move to "Active" tab
4. ✅ Affiliate can now login successfully

## PostgreSQL Commands

Connect to your database:
```bash
psql -U your_username -d your_database_name
```

Run the verification query:
```sql
\x  -- Enable expanded display for better readability
SELECT * FROM users WHERE role = 'AFFILIATE' ORDER BY created_at DESC LIMIT 5;
```

Check count of pending affiliates:
```sql
SELECT COUNT(*) as pending_count 
FROM users 
WHERE role = 'AFFILIATE' AND status = 'PENDING';
```

## Troubleshooting

### If PENDING users still don't show in admin panel:

1. **Clear browser cache and reload**
   ```bash
   # Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   ```

2. **Restart the Next.js dev server**
   ```bash
   npm run dev
   ```

3. **Check if data is reaching the API**
   - Open browser DevTools → Network tab
   - Go to Partners page
   - Look for `/api/admin/affiliates` request
   - Check the response JSON - verify `user.status` is 'PENDING'

4. **Verify the fix is applied**
   ```bash
   # Check that line 632 no longer has || 'ACTIVE'
   grep -n "status: aff.user.status" src/app/admin/page.tsx
   # Should show: status: aff.user.status,
   ```

---

**Last Updated:** 2025-01-24
