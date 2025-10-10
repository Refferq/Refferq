#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * This script helps you verify that your Resend email configuration is working correctly.
 * 
 * Usage:
 *   node scripts/test-email.js <your-email@example.com>
 * 
 * Example:
 *   node scripts/test-email.js john@example.com
 */

require('dotenv').config({ path: '.env.local' });

async function testEmailConfiguration() {
  console.log('\n🧪 Testing Email Configuration...\n');

  // Check required environment variables
  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  let hasErrors = false;

  console.log('📋 Checking Environment Variables:\n');
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      console.log(`  ❌ ${key} - NOT SET`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const displayValue = key === 'RESEND_API_KEY' 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`  ✅ ${key} - ${displayValue}`);
    }
  }

  console.log('');

  if (hasErrors) {
    console.log('❌ Configuration Error: Missing required environment variables');
    console.log('');
    console.log('Please add the missing variables to your .env.local file:');
    console.log('');
    console.log('  RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
    console.log('  RESEND_FROM_EMAIL="Refferq <onboarding@resend.dev>"');
    console.log('  NEXT_PUBLIC_APP_URL="http://localhost:3000"');
    console.log('');
    console.log('Get your Resend API key from: https://resend.com/api-keys');
    console.log('');
    process.exit(1);
  }

  // Get recipient email from command line argument
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.log('❌ Error: Please provide a recipient email address');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/test-email.js <your-email@example.com>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/test-email.js john@example.com');
    console.log('');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    console.log(`❌ Invalid email format: ${recipientEmail}`);
    console.log('');
    process.exit(1);
  }

  console.log(`📧 Sending test email to: ${recipientEmail}\n`);

  try {
    // Dynamic import to use ES modules
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: recipientEmail,
      subject: 'Refferq Email Configuration Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Email Test</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Email Configuration Test</h1>
          </div>
          <div class="content">
            <h2>Success!</h2>
            <div class="success-box">
              <strong>Your Refferq email configuration is working correctly!</strong>
            </div>
            <p>This is a test email sent from your Refferq application to verify that:</p>
            <ul>
              <li>✅ Resend API key is valid</li>
              <li>✅ Email service is properly configured</li>
              <li>✅ Emails can be sent successfully</li>
            </ul>
            <p>You're all set! Your welcome emails, referral notifications, and other transactional emails will now be sent automatically.</p>
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>From:</strong> ${process.env.RESEND_FROM_EMAIL}</li>
              <li><strong>To:</strong> ${recipientEmail}</li>
              <li><strong>App URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL}</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Refferq. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('Details:');
    console.log(`  Message ID: ${result.data?.id || 'N/A'}`);
    console.log(`  From: ${process.env.RESEND_FROM_EMAIL}`);
    console.log(`  To: ${recipientEmail}`);
    console.log('');
    console.log('📬 Check your inbox (and spam folder) for the test email.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify the email arrived successfully');
    console.log('  2. Test user registration to receive welcome email');
    console.log('  3. Monitor email delivery in Resend dashboard');
    console.log('');
    console.log('Resend Dashboard: https://resend.com/emails');
    console.log('');

  } catch (error) {
    console.log('❌ Failed to send email');
    console.log('');
    console.log('Error details:');
    console.log(`  ${error.message}`);
    console.log('');
    
    if (error.message.includes('API key')) {
      console.log('💡 Tips:');
      console.log('  - Verify your RESEND_API_KEY in .env.local');
      console.log('  - Ensure the API key starts with "re_"');
      console.log('  - Check that the key has "Sending Access" permissions');
      console.log('  - Generate a new key if needed: https://resend.com/api-keys');
    } else if (error.message.includes('from')) {
      console.log('💡 Tips:');
      console.log('  - Check RESEND_FROM_EMAIL format: "Name <email@domain.com>"');
      console.log('  - For development, use: "Refferq <onboarding@resend.dev>"');
      console.log('  - For production, verify your domain in Resend dashboard');
    } else {
      console.log('💡 Tips:');
      console.log('  - Check Resend service status: https://resend.com/status');
      console.log('  - Review Resend documentation: https://resend.com/docs');
      console.log('  - Check email logs in Resend dashboard');
    }
    
    console.log('');
    process.exit(1);
  }
}

// Run the test
testEmailConfiguration().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
