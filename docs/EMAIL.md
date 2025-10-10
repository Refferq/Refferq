# Email Configuration Guide for Refferq

## Overview

Refferq uses [Resend](https://resend.com) for sending transactional emails. Resend is a modern email API designed for developers with:

- **3,000 free emails/month** on the free tier
- Easy integration with Next.js
- 100+ delivery rate
- Email tracking and analytics
- Beautiful HTML email templates

## Setup Instructions

### Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address
4. Navigate to **API Keys** in the dashboard

### Step 2: Generate API Key

1. Click **"Create API Key"**
2. Give it a name (e.g., "Refferq Production")
3. Select permissions: **Full Access** or **Sending Access**
4. Copy the API key (starts with `re_...`)
5. **Important:** Save this key securely - you won't be able to see it again

### Step 3: Configure Domain (Optional but Recommended)

For production, you should verify your domain:

1. Go to **Domains** in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain (e.g., `refferq.com`)
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (usually takes 1-48 hours)

Once verified, you can send emails from addresses like:
- `noreply@refferq.com`
- `support@refferq.com`
- `hello@refferq.com`

### Step 4: Environment Variables

Add these variables to your `.env.local` file:

```env
# Resend API Key (required)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# From Email Address
# For development: Use "onboarding@resend.dev"
# For production: Use your verified domain
RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"

# Admin Notification Emails (comma-separated)
ADMIN_EMAILS="admin@yourdomain.com,support@yourdomain.com"

# Application URL (required for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 5: Development vs Production

#### Development Setup
For development, you can use Resend's default sending address:

```env
RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"
```

This works immediately without domain verification.

#### Production Setup
For production, use your verified domain:

```env
RESEND_FROM_EMAIL="Refferq <noreply@refferq.com>"
```

Make sure your domain is verified in Resend dashboard before deploying.

## Email Templates

Refferq includes the following email templates:

### 1. Welcome Email
**Trigger:** When a new affiliate or admin registers  
**Recipient:** The registered user  
**Content:**
- Personalized greeting
- Account status (PENDING for affiliates, ACTIVE for admins)
- Next steps and features overview
- Login link

### 2. Referral Notification Email
**Trigger:** When an affiliate submits a new referral  
**Recipient:** Admin team (from `ADMIN_EMAILS`)  
**Content:**
- Affiliate name
- Lead details (name, email, company)
- Estimated value
- Review link to admin dashboard

### 3. Approval Email
**Trigger:** When an admin approves or rejects a referral  
**Recipient:** The affiliate who submitted the referral  
**Content:**
- Approval/rejection status
- Commission amount (if approved)
- Admin notes/feedback
- Dashboard link

### 4. Payout Notification Email
**Trigger:** When a payout is processed  
**Recipient:** The affiliate receiving the payout  
**Content:**
- Payout amount
- Payment method (Bank Transfer or Stripe Connect)
- Processing date
- Dashboard link

### 5. Password Reset Email
**Trigger:** When a user requests password reset  
**Recipient:** The user requesting reset  
**Content:**
- Secure reset link (expires in 1 hour)
- Security warnings
- Support contact

### 6. Email Verification Email
**Trigger:** When email verification is required  
**Recipient:** The user to verify  
**Content:**
- Verification link (expires in 24 hours)
- Account activation info

## Testing Email Functionality

### Test Endpoint

Use the built-in test endpoint to verify email configuration:

```bash
# Test welcome email
curl -X POST http://localhost:3000/api/admin/emails/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "welcome",
    "to": "test@example.com",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "role": "affiliate",
      "loginUrl": "http://localhost:3000/login"
    }
  }'
```

### Manual Testing

1. **Register a new affiliate:**
   - Go to `/register`
   - Fill in name and email
   - Submit form
   - Check email inbox for welcome email

2. **Check spam folder:**
   - If using Gmail, emails from `onboarding@resend.dev` may go to spam initially
   - Mark as "Not Spam" to train Gmail

3. **Verify in Resend dashboard:**
   - Log into Resend
   - Go to **Emails** tab
   - View sent emails, delivery status, and open rates

## Troubleshooting

### Emails Not Sending

1. **Check API Key:**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY
   ```

2. **Check Server Logs:**
   Look for error messages in terminal:
   ```
   ⚠️ Failed to send welcome email: Error details...
   ```

3. **Verify Resend Status:**
   - Check [Resend Status Page](https://resend.com/status)
   - Ensure service is operational

4. **API Key Permissions:**
   - Ensure API key has "Sending Access" or "Full Access"
   - Regenerate key if needed

### Emails Going to Spam

1. **Domain Verification:**
   - Verify your domain in Resend dashboard
   - Add all required DNS records (SPF, DKIM, DMARC)

2. **Sender Reputation:**
   - Start with small volumes
   - Gradually increase sending
   - Monitor bounce rates

3. **Email Content:**
   - Avoid spam trigger words
   - Include unsubscribe link (for marketing emails)
   - Use verified sender address

### Domain Verification Issues

1. **DNS Records Not Propagating:**
   - Wait 24-48 hours for DNS propagation
   - Use [DNS Checker](https://dnschecker.org) to verify records

2. **Incorrect DNS Records:**
   - Double-check record type (CNAME, TXT, MX)
   - Ensure no typos in values
   - Remove old conflicting records

3. **Multiple Domains:**
   - Verify each subdomain separately if needed
   - Use primary domain for main emails

## Rate Limits

### Free Tier
- **3,000 emails/month**
- **100 emails/day**
- Suitable for development and small-scale testing

### Paid Tiers
If you exceed free tier limits:
- **Pro Plan:** $20/month - 50,000 emails
- **Business Plan:** $100/month - 300,000 emails
- **Enterprise:** Custom pricing for high volume

## Best Practices

### 1. Email Deliverability
- Always verify your domain for production
- Use consistent sender names and addresses
- Monitor bounce rates and spam complaints
- Include clear unsubscribe options

### 2. Error Handling
- Emails are sent non-blocking (registration still succeeds if email fails)
- Failed emails are logged to console
- Consider implementing a retry queue for critical emails

### 3. Security
- Never expose `RESEND_API_KEY` in client-side code
- Rotate API keys periodically
- Use environment-specific keys (dev, staging, prod)

### 4. Monitoring
- Set up email notifications in Resend dashboard
- Monitor delivery rates weekly
- Track open rates to improve templates

### 5. Template Customization
- Update HTML templates in `src/lib/email.ts`
- Test templates across email clients (Gmail, Outlook, Apple Mail)
- Use inline CSS for maximum compatibility
- Include plain text versions for accessibility

## Support

### Resend Support
- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Discord Community: [https://discord.gg/resend](https://discord.gg/resend)
- Email: support@resend.com

### Refferq Support
For issues specific to Refferq's email implementation:
- Check server logs for error messages
- Review `src/lib/email.ts` for email service code
- Test with `POST /api/admin/emails/test` endpoint
- Verify environment variables are set correctly

## Environment Variables Reference

```env
# Required
RESEND_API_KEY=""              # Your Resend API key
RESEND_FROM_EMAIL=""           # Sender email address
NEXT_PUBLIC_APP_URL=""         # Your app URL (for email links)

# Optional
ADMIN_EMAILS=""                # Comma-separated admin emails
```

## Example .env.local

```env
# Development
RESEND_API_KEY="re_123abc456def789ghi"
RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"
ADMIN_EMAILS="admin@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Migration from Other Email Services

If you're migrating from Nodemailer or other email services:

1. The email templates are already HTML-based and compatible
2. Update environment variables from `EMAIL_*` to `RESEND_*`
3. No code changes needed in application logic
4. Email service API remains the same (`emailService.sendWelcomeEmail()`)

## Next Steps

After email is configured:

1. ✅ Test registration flow
2. ✅ Verify welcome email delivery
3. ✅ Set up admin notification emails
4. ✅ Test referral approval emails
5. ✅ Configure payout notification emails
6. ✅ Monitor email analytics in Resend dashboard
