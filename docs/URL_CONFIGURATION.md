# URL Configuration Update Summary

## Production URLs Configuration

All application URLs have been updated from localhost to production domains:

### Domain Structure
- **Marketing Website**: `https://refferq.com`
- **Application**: `https://app.refferq.com`

---

## ✅ Files Successfully Updated

### 1. Environment Configuration
- **`.env.example`** - Updated `NEXT_PUBLIC_APP_URL` to `https://app.refferq.com`

### 2. Application Code
- **`src/app/api/auth/register/route.ts`** - Updated default login URL fallback
  - Changed: `http://localhost:3000` → `https://app.refferq.com`

### 3. Documentation
- **`README.md`** - Updated app URL examples and curl commands
- **`frontend/docs.html`** - Updated environment variables and success message with production URLs

### 4. Frontend Marketing Site
All frontend HTML files have been updated with production URLs:
- **`frontend/index.html`**
  - Meta tags: Open Graph and Twitter Cards
  - Navigation links point to `app.refferq.com`
  - Hero CTAs updated
  
- **`frontend/features.html`**
  - Meta tags updated
  - Navigation and CTA links updated
  
- **`frontend/pricing.html`**
  - Meta tags updated
  - Navigation and CTA links updated
  
- **`frontend/docs.html`**
  - Code examples and documentation updated

### 5. SEO & Configuration Files
- **`frontend/sitemap.xml`**
  - Marketing pages: `https://refferq.com/*`
  - App pages: `https://app.refferq.com/*`
  
- **`frontend/robots.txt`** - Marketing site sitemap URL
- **`public/robots.txt`** - App sitemap URL
- **`frontend/security.txt`** - Canonical URL
- **`frontend/humans.txt`** - Site URL
- **`frontend/README.md`** - Live demo links

---

## 🔧 Configuration Required

### Environment Variables

Update your `.env` file with the production URL:

```bash
# Copy from .env.example
NEXT_PUBLIC_APP_URL="https://app.refferq.com"

# Database (use production credentials)
DATABASE_URL="postgresql://user:password@host:5432/refferq"

# Email
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@refferq.com"

# JWT
JWT_SECRET="your-production-secret-min-32-chars"
```

### Vercel Configuration

1. **Add Custom Domains** in Vercel Dashboard:
   ```
   Primary Domain: refferq.com → Frontend
   App Domain: app.refferq.com → Next.js App
   ```

2. **Environment Variables** in Vercel:
   - Add `NEXT_PUBLIC_APP_URL=https://app.refferq.com`
   - Add all other production environment variables

3. **DNS Configuration**:
   ```
   A     @                  → Vercel IP
   CNAME app.refferq.com    → cname.vercel-dns.com
   CNAME www.refferq.com    → cname.vercel-dns.com (optional)
   ```

---

## 📋 Remaining Updates Needed

Some documentation files still reference localhost for development purposes. These are intentionally left as examples:

### Development Documentation (Keep as localhost examples):
- `wiki/Quick-Start-Guide.md` - Local development instructions
- `wiki/API-Overview.md` - API example commands
- `wiki/Contributing.md` - Contributor setup guide
- `docs/EMAIL_IMPLEMENTATION.md` - Email testing guide
- `scripts/test-email.js` - Test script
- `ANNOUNCEMENT.md` - Setup instructions
- `RELEASE_NOTES.md` - Quick start guide

**Note**: These files contain localhost references for **development/testing purposes** and should remain that way so developers can follow the guides locally.

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Update `.env` with production values
- [ ] Verify DATABASE_URL points to production database
- [ ] Confirm RESEND_API_KEY is active
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Update EMAIL_FROM to your domain

### DNS & SSL
- [ ] Configure DNS A/CNAME records
- [ ] Verify SSL certificates are active (HTTPS)
- [ ] Test both domains resolve correctly
- [ ] Verify redirects (www → non-www or vice versa)

### Vercel Setup
- [ ] Add both domains in Vercel project
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure production branch (main)
- [ ] Enable automatic deployments
- [ ] Test deployment preview

### Post-Deployment Testing
- [ ] Visit https://refferq.com (marketing site)
- [ ] Visit https://app.refferq.com (application)
- [ ] Test user registration flow
- [ ] Verify emails are sent with correct URLs
- [ ] Check all internal links work
- [ ] Test affiliate dashboard
- [ ] Test admin dashboard
- [ ] Verify API endpoints respond correctly

### SEO & Monitoring
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Add domain to analytics (if using)
- [ ] Set up uptime monitoring
- [ ] Verify meta tags render correctly
- [ ] Test social media sharing (Open Graph)

---

## 📝 Quick Reference

### Application URLs
| Purpose | URL |
|---------|-----|
| Marketing Homepage | https://refferq.com |
| Features Page | https://refferq.com/features.html |
| Pricing Page | https://refferq.com/pricing.html |
| Documentation | https://refferq.com/docs.html |
| User Registration | https://app.refferq.com/register |
| User Login | https://app.refferq.com/login |
| Admin Dashboard | https://app.refferq.com/admin |
| Affiliate Dashboard | https://app.refferq.com/affiliate |

### API Endpoints
| Purpose | URL |
|---------|-----|
| Base API URL | https://app.refferq.com/api |
| Authentication | https://app.refferq.com/api/auth/* |
| Admin APIs | https://app.refferq.com/api/admin/* |
| Affiliate APIs | https://app.refferq.com/api/affiliate/* |
| Tracking APIs | https://app.refferq.com/api/track/* |

---

## 🆘 Troubleshooting

### Issue: Emails contain localhost URLs
**Solution**: Update `NEXT_PUBLIC_APP_URL` in your production environment variables

### Issue: API calls fail with CORS errors
**Solution**: Verify `NEXT_PUBLIC_APP_URL` is set correctly and matches your domain

### Issue: Redirects not working
**Solution**: Check Vercel domain configuration and DNS settings

### Issue: SSL certificate errors
**Solution**: Ensure Vercel has provisioned SSL for both domains (usually automatic)

### Issue: 404 on marketing pages
**Solution**: Verify frontend files are deployed to the correct domain/project

---

## 📞 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Verify DNS propagation (can take up to 48 hours)
3. Review Vercel deployment logs
4. Consult the [GitHub Discussions](https://github.com/Refferq/Refferq/discussions)

---

**Last Updated**: October 12, 2025  
**Applies To**: Refferq v1.0.0+
