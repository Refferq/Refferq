# Testing Commission Rates by Partner Group

## 🎯 Quick Test Guide

### Overview
Commission rates are now **dynamic** based on the affiliate's **Partner Group**. This guide helps you verify the system works correctly.

---

## ✅ Pre-Test Checklist

- [ ] Development server is running (`npm run dev`)
- [ ] .next cache has been cleared
- [ ] Have admin account credentials
- [ ] Have at least 2-3 test affiliate accounts
- [ ] Database is accessible

---

## 📝 Test Scenario 1: Default Commission Rate

**Goal:** Verify default 20% commission rate works

### Steps:
1. **Login as Affiliate** (any affiliate)
2. **Submit a Lead:**
   - Name: "Test Lead 1"
   - Email: "test1@example.com"
   - Estimated Value: **10000** (₹10,000)
3. **Logout** from affiliate

4. **Login as Admin**
5. **Navigate to Customers** section
6. **Find "Test Lead 1"** in the table

### ✅ Expected Results:
- **Total Paid**: ₹10,000.00
- **Total Commission**: ₹2,000.00 (20% of ₹10,000)
- **Status**: Lead (PENDING)

---

## 📝 Test Scenario 2: Multiple Partner Groups

**Goal:** Verify different affiliates get different commission rates

### Setup (Admin):
1. **Go to Program Settings → Partner Groups**
2. **Create Partner Groups:**

   **Group 1: Default**
   - Name: Default
   - Commission Rate: 20
   - Description: Standard partners earn 20%

   **Group 2: Premium**
   - Name: Premium
   - Commission Rate: 25
   - Description: Premium partners earn 25%

   **Group 3: Enterprise**
   - Name: Enterprise
   - Commission Rate: 30
   - Description: Enterprise partners earn 30%

3. **Assign Affiliates:**
   - Go to **Partners** tab
   - **Affiliate 1** → Partner Group: Default
   - **Affiliate 2** → Partner Group: Premium
   - **Affiliate 3** → Partner Group: Enterprise
   - Save each

### Test (Each Affiliate):

**Affiliate 1 (Default - 20%):**
- Submit lead with estimated value: ₹10,000
- Expected commission: ₹2,000

**Affiliate 2 (Premium - 25%):**
- Submit lead with estimated value: ₹10,000
- Expected commission: ₹2,500

**Affiliate 3 (Enterprise - 30%):**
- Submit lead with estimated value: ₹10,000
- Expected commission: ₹3,000

### ✅ Verify in Admin Dashboard:

| Lead Name | Partner | Partner Group | Total Paid | Total Commission |
|-----------|---------|--------------|------------|-----------------|
| Lead from Aff1 | Affiliate 1 | Default | ₹10,000.00 | ₹2,000.00 ✅ |
| Lead from Aff2 | Affiliate 2 | Premium | ₹10,000.00 | ₹2,500.00 ✅ |
| Lead from Aff3 | Affiliate 3 | Enterprise | ₹10,000.00 | ₹3,000.00 ✅ |

---

## 📝 Test Scenario 3: Changing Partner Group

**Goal:** Verify commission updates when affiliate's group changes

### Steps:
1. **As Admin → Partners**
2. **Select Affiliate 1** (currently in "Default" - 20%)
3. **Change Partner Group** to "Premium" (25%)
4. **Save changes**

5. **As Affiliate 1:**
   - Submit new lead with estimated value: ₹5,000

6. **As Admin → Customers:**
   - Find the new lead
   - ✅ Verify commission: **₹1,250.00** (25%, not 20%)

---

## 📝 Test Scenario 4: Various Amounts

**Goal:** Test commission calculation with different amounts

### Test Data:

| Affiliate | Group | Rate | Est. Value | Expected Commission |
|-----------|-------|------|-----------|-------------------|
| Alice | Default | 20% | ₹5,000 | ₹1,000.00 |
| Alice | Default | 20% | ₹7,500 | ₹1,500.00 |
| Bob | Premium | 25% | ₹8,000 | ₹2,000.00 |
| Bob | Premium | 25% | ₹12,000 | ₹3,000.00 |
| Carol | Enterprise | 30% | ₹10,000 | ₹3,000.00 |
| Carol | Enterprise | 30% | ₹15,000 | ₹4,500.00 |

### Steps:
1. Submit each lead as the respective affiliate
2. Verify calculations in admin dashboard

---

## 📝 Test Scenario 5: Sorting by Commission

**Goal:** Verify table sorting works correctly

### Steps:
1. **As Admin → Customers**
2. **Click "Total Commission" column header**
3. ✅ Table should sort ascending (lowest to highest)
4. **Click again**
5. ✅ Table should sort descending (highest to lowest)

### Expected Order (Descending):
1. Carol's ₹15,000 lead → ₹4,500 commission (30%)
2. Carol's ₹10,000 lead → ₹3,000 commission (30%)
3. Bob's ₹12,000 lead → ₹3,000 commission (25%)
4. ...and so on

---

## 🐛 Troubleshooting

### Issue: All commissions show 20%

**Possible Causes:**
1. Partner Groups not loaded
2. Affiliates not assigned to groups
3. Browser cache

**Solutions:**
```powershell
# 1. Clear cache and restart
Remove-Item -Recurse -Force .next
npm run dev

# 2. Hard refresh browser
Ctrl + Shift + R

# 3. Check browser console
F12 → Console → Look for errors
```

### Issue: Commission shows ₹0.00

**Check:**
1. Did affiliate enter estimated value?
2. Open browser console (F12)
3. Look for `ref.estimatedValue` in network tab
4. Verify `/api/admin/referrals` response includes `estimatedValue`

### Issue: Partner Group not found

**Solution:**
```sql
-- Check affiliate's partner group in database
SELECT id, payout_details FROM affiliates;

-- Should show: {"partnerGroup": "Premium"}
-- If empty, update via admin dashboard
```

---

## 🎯 Manual Calculation Verification

Use this to verify calculations are correct:

```javascript
// Formula
Commission = Estimated Value × (Commission Rate ÷ 100)

// Examples:
₹10,000 × (20 ÷ 100) = ₹10,000 × 0.20 = ₹2,000  ✅
₹10,000 × (25 ÷ 100) = ₹10,000 × 0.25 = ₹2,500  ✅
₹10,000 × (30 ÷ 100) = ₹10,000 × 0.30 = ₹3,000  ✅

₹5,000 × (20 ÷ 100) = ₹5,000 × 0.20 = ₹1,000   ✅
₹8,000 × (25 ÷ 100) = ₹8,000 × 0.25 = ₹2,000   ✅
₹15,000 × (30 ÷ 100) = ₹15,000 × 0.30 = ₹4,500  ✅
```

---

## 📊 Testing Checklist

- [ ] Default commission rate (20%) works
- [ ] Created multiple Partner Groups with different rates
- [ ] Assigned affiliates to different groups
- [ ] Submitted leads from each affiliate
- [ ] Verified correct commission for each lead
- [ ] Changed affiliate's group and verified new commission
- [ ] Tested sorting by commission amount
- [ ] Tested with various estimated values
- [ ] Tested edge cases (₹0, very large amounts)
- [ ] Verified currency formatting (₹X,XXX.XX)
- [ ] Tested on fresh browser (no cache)

---

## 🎉 Success Criteria

✅ **ALL of the following must be true:**

1. Each Partner Group's commission rate is respected
2. Different affiliates in different groups get different commissions
3. Commission correctly calculated for all estimated values
4. Values display in proper currency format
5. Sorting works correctly
6. No console errors
7. No TypeScript errors
8. Changes to Partner Group immediately affect new leads
9. Admin can see both estimated value and commission
10. Table is sortable and searchable

---

**Last Updated:** October 13, 2025  
**Feature:** Dynamic Commission Rates by Partner Group  
**Status:** Ready for Testing ✅
