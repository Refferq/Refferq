# Client-Side Exception Error - Troubleshooting Guide

## 🚨 Error Message
```
Application error: a client-side exception has occurred while loading app.refferq.com
(see the browser console for more information)
```

## 🔍 Common Causes & Solutions

### 1. **Build Cache Issue** (Most Likely)

After our recent code changes, the Next.js build cache might be stale.

#### Solution:
```powershell
# Clear Next.js cache and rebuild
Remove-Item -Recurse -Force .next
npm run build
npm run start

# Or for development:
Remove-Item -Recurse -Force .next
npm run dev
```

---

### 2. **Browser Cache Issue**

Your browser might be serving old JavaScript files.

#### Solution:
1. **Hard Refresh:**
   - **Windows:** `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`

2. **Clear Cache:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Incognito/Private Mode:**
   - Test in a new incognito window

---

### 3. **Check Browser Console for Specific Error**

The generic error message hides the real issue. You need to see the actual error.

#### How to Check:
1. Open browser DevTools: `F12`
2. Click on **Console** tab
3. Look for red error messages
4. Common errors to look for:
   - `Cannot read properties of undefined`
   - `Hydration error`
   - `Module not found`
   - `Unexpected token`

#### Take Action Based on Error:

**If you see:**
```
TypeError: Cannot read properties of undefined (reading 'toFixed')
```
→ This should be fixed with our recent changes, try clearing cache

**If you see:**
```
Hydration error
```
→ Server and client are rendering differently, check for date/time rendering

**If you see:**
```
Module not found
```
→ Run `npm install` to ensure all dependencies are installed

---

### 4. **Node Modules Issue**

Dependencies might not be properly installed.

#### Solution:
```powershell
# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

### 5. **Environment Variables Missing**

Check if all required environment variables are set.

#### Solution:
```powershell
# Verify .env.local exists and has all required variables
cat .env.local

# Required variables:
# DATABASE_URL
# JWT_SECRET
# RESEND_API_KEY
# NEXT_PUBLIC_APP_URL
```

---

### 6. **Port Conflict**

Another process might be using port 3000.

#### Solution:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=3001; npm run dev
```

---

## 🧪 Step-by-Step Debugging Process

### Step 1: Clear Everything
```powershell
# Stop the server (Ctrl+C if running)

# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Clear browser cache (Hard refresh: Ctrl+Shift+R)
```

### Step 2: Rebuild and Restart
```powershell
# For development:
npm run dev

# For production:
npm run build
npm run start
```

### Step 3: Check Browser Console
1. Open app in browser
2. Open DevTools (F12)
3. Look at Console tab
4. **Take a screenshot or copy the exact error message**

### Step 4: Test Different Pages
- Visit `/login` - Does it work?
- Login and visit `/affiliate` - Does it work?
- Login as admin and visit `/admin` - Does it work?

### Step 5: Check Recent Changes
Our recent changes that might cause issues:
1. ✅ Fixed `status: aff.user.status` (removed `|| 'ACTIVE'`)
2. ✅ Fixed `(ref.estimatedValue || 0).toFixed(2)`
3. ✅ Added metadata mapping in API

These should all be safe, but verify they're working.

---

## 📋 Quick Checklist

- [ ] Cleared `.next` folder
- [ ] Restarted development server
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Checked browser console for specific error
- [ ] Verified all environment variables are set
- [ ] Ran `npm install` to ensure dependencies
- [ ] Tested in incognito mode
- [ ] Checked that port 3000 is not in use by another process

---

## 🔧 Emergency Rollback

If the issue persists and is critical, you can rollback:

```powershell
# Check recent commits
git log --oneline -5

# Rollback to previous commit (replace COMMIT_HASH)
git reset --hard COMMIT_HASH

# Force push (if already pushed to remote)
git push origin main --force

# Rebuild
Remove-Item -Recurse -Force .next
npm run dev
```

---

## 💡 Most Likely Solution

Based on the timing (right after our code push), the issue is **almost certainly**:

### **Cached Build Files**

```powershell
# Run this NOW:
Remove-Item -Recurse -Force .next
npm run dev
```

Then hard refresh your browser: **Ctrl + Shift + R**

---

## 📞 If Issue Persists

If none of the above works, please provide:

1. **Exact error message from browser console**
2. **Which page you're trying to visit** (login, affiliate, admin)
3. **Screenshot of the error**
4. **Output of:** `npm run build` (any errors?)

---

## ✅ Verification Steps After Fix

Once the error is resolved:

1. ✅ Visit `/login` - Should load without errors
2. ✅ Register new affiliate - Should work
3. ✅ Login as affiliate - Should redirect to dashboard
4. ✅ Submit a lead - Should display correctly with estimated value
5. ✅ Login as admin - Should see pending affiliates
6. ✅ No errors in browser console

---

**Created:** 2025-10-13  
**Status:** Troubleshooting in progress  
**Priority:** HIGH
