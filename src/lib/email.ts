import { Resend } from 'resend';

// Initialize Resend with API key only when needed (server-side)
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const resend = {
  get emails() {
    return getResendClient().emails;
  }
};

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  role: 'affiliate' | 'admin';
  loginUrl: string;
}

export interface ReferralNotificationData {
  affiliateName: string;
  leadName: string;
  leadEmail: string;
  company?: string;
  estimatedValue?: number;
}

export interface ApprovalEmailData {
  affiliateName: string;
  referralId: string;
  leadName: string;
  commissionAmount: number;
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface PayoutNotificationData {
  affiliateName: string;
  amount: number;
  method: 'bank_csv' | 'stripe_connect';
  processingDate: string;
}

class EmailService {
  private defaultFrom = process.env.RESEND_FROM_EMAIL || 'Refferq <noreply@refferq.com>';

  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Refferq</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Refferq! 🎉</h1>
      </div>
      <div class="content">
        <h2>Hello ${data.name}!</h2>
        <p>Thank you for joining our affiliate platform as a <strong>${data.role}</strong>.</p>
        
        ${data.role === 'affiliate' ? `
        <p>Your account is currently pending approval. Our admin team will review your application and activate your account within 24-48 hours.</p>
        <p>Once approved, you'll be able to:</p>
        <ul>
          <li>Generate unique referral links</li>
          <li>Submit manual referrals</li>
          <li>Track your commissions and earnings</li>
          <li>Access marketing materials</li>
        </ul>
        ` : `
        <p>Your admin account has been created and is ready to use.</p>
        <p>You can now:</p>
        <ul>
          <li>Manage affiliate applications</li>
          <li>Review and approve referrals</li>
          <li>Process commission payments</li>
          <li>Access platform analytics</li>
        </ul>
        `}
        
        <div style="text-align: center;">
          <a href="${data.loginUrl}" class="button">Login to Your Account</a>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Refferq Team</p>
      </div>
      <div class="footer">
        <p>This email was sent to ${data.email}</p>
        <p>© ${new Date().getFullYear()} Refferq. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }

  private generateReferralNotificationHTML(data: ReferralNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Referral Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Referral Submission 📋</h1>
      </div>
      <div class="content">
        <h2>Hello Admin!</h2>
        <p>A new referral has been submitted and requires your review.</p>
        
        <div class="details">
          <h3>Referral Details:</h3>
          <p><strong>Affiliate:</strong> ${data.affiliateName}</p>
          <p><strong>Lead Name:</strong> ${data.leadName}</p>
          <p><strong>Lead Email:</strong> ${data.leadEmail}</p>
          ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
          ${data.estimatedValue ? `<p><strong>Estimated Value:</strong> $${(data.estimatedValue / 100).toFixed(2)}</p>` : ''}
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" class="button">Review Referral</a>
        </div>
        
        <p>Please review this referral in the admin dashboard and approve or reject it accordingly.</p>
        
        <p>Best regards,<br>The Refferq System</p>
      </div>
    </body>
    </html>
    `;
  }

  private generateApprovalEmailHTML(data: ApprovalEmailData): string {
    const isApproved = data.status === 'approved';
    const statusColor = isApproved ? '#28a745' : '#dc3545';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    const emoji = isApproved ? '✅' : '❌';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Referral ${statusText}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
        .button { display: inline-block; background: ${statusColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Referral ${statusText} ${emoji}</h1>
      </div>
      <div class="content">
        <h2>Hello ${data.affiliateName}!</h2>
        <p>Your referral submission has been <strong>${statusText.toLowerCase()}</strong>.</p>
        
        <div class="details">
          <h3>Referral Details:</h3>
          <p><strong>Lead Name:</strong> ${data.leadName}</p>
          <p><strong>Status:</strong> ${statusText}</p>
          ${isApproved ? `<p><strong>Commission Amount:</strong> $${(data.commissionAmount / 100).toFixed(2)}</p>` : ''}
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        ${isApproved ? `
        <p>🎉 Congratulations! Your referral has been approved and the commission has been added to your account.</p>
        ` : `
        <p>Unfortunately, this referral did not meet our approval criteria. Please review the feedback and feel free to submit future referrals.</p>
        `}
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" class="button">View Dashboard</a>
        </div>
        
        <p>Best regards,<br>The Refferq Team</p>
      </div>
    </body>
    </html>
    `;
  }

  private generatePayoutNotificationHTML(data: PayoutNotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payout Processed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4facfe; }
        .button { display: inline-block; background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Payout Processed 💰</h1>
      </div>
      <div class="content">
        <h2>Hello ${data.affiliateName}!</h2>
        <p>Great news! Your commission payout has been processed.</p>
        
        <div class="details">
          <h3>Payout Details:</h3>
          <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
          <p><strong>Method:</strong> ${data.method === 'stripe_connect' ? 'Stripe Connect' : 'Bank Transfer'}</p>
          <p><strong>Processing Date:</strong> ${data.processingDate}</p>
        </div>
        
        ${data.method === 'bank_csv' ? `
        <p>Your payout will be processed via bank transfer within 3-5 business days.</p>
        ` : `
        <p>Your payout has been sent to your connected Stripe account and should be available immediately.</p>
        `}
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" class="button">View Dashboard</a>
        </div>
        
        <p>Thank you for being a valued affiliate partner!</p>
        
        <p>Best regards,<br>The Refferq Team</p>
      </div>
    </body>
    </html>
    `;
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: data.email,
        subject: `Welcome to Refferq - ${data.role === 'affiliate' ? 'Affiliate' : 'Admin'} Account Created`,
        html: this.generateWelcomeEmailHTML(data),
      });

      console.log('Welcome email sent:', result);
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, message: 'Failed to send welcome email' };
    }
  }

  async sendReferralNotification(data: ReferralNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      // Get admin emails from environment or database
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@yourdomain.com'];

      const promises = adminEmails.map(email => 
        resend.emails.send({
          from: this.defaultFrom,
          to: email.trim(),
          subject: `New Referral Submission from ${data.affiliateName}`,
          html: this.generateReferralNotificationHTML(data),
        })
      );

      await Promise.all(promises);
      console.log('Referral notification emails sent');
      return { success: true, message: 'Referral notification sent successfully' };
    } catch (error) {
      console.error('Failed to send referral notification:', error);
      return { success: false, message: 'Failed to send referral notification' };
    }
  }

  async sendApprovalEmail(affiliateEmail: string, data: ApprovalEmailData): Promise<{ success: boolean; message: string }> {
    try {
      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: affiliateEmail,
        subject: `Referral ${data.status === 'approved' ? 'Approved' : 'Rejected'} - ${data.leadName}`,
        html: this.generateApprovalEmailHTML(data),
      });

      console.log('Approval email sent:', result);
      return { success: true, message: 'Approval email sent successfully' };
    } catch (error) {
      console.error('Failed to send approval email:', error);
      return { success: false, message: 'Failed to send approval email' };
    }
  }

  async sendPayoutNotification(affiliateEmail: string, data: PayoutNotificationData): Promise<{ success: boolean; message: string }> {
    try {
      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: affiliateEmail,
        subject: `Payout Processed - $${(data.amount / 100).toFixed(2)}`,
        html: this.generatePayoutNotificationHTML(data),
      });

      console.log('Payout notification sent:', result);
      return { success: true, message: 'Payout notification sent successfully' };
    } catch (error) {
      console.error('Failed to send payout notification:', error);
      return { success: false, message: 'Failed to send payout notification' };
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request 🔐</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>We received a request to reset your password for your affiliate platform account.</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Your Password</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with others</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `;

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: email,
        subject: 'Password Reset Request - Refferq',
        html,
      });

      console.log('Password reset email sent:', result);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, message: 'Failed to send password reset email' };
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email Address</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Verify Your Email Address ✉️</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>Thank you for registering with our affiliate platform. Please verify your email address to complete your registration.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `;

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: email,
        subject: 'Verify Your Email Address - Refferq',
        html,
      });

      console.log('Verification email sent:', result);
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, message: 'Failed to send verification email' };
    }
  }

  async sendTransactionCreatedEmail(
    affiliateEmail: string,
    data: {
      affiliateName: string;
      customerName: string;
      amountCents: number;
      commissionCents: number;
      commissionRate: number;
      transactionId: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const amount = (data.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const commission = (data.commissionCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const rate = (data.commissionRate * 100).toFixed(0);
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Commission Earned!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .commission { font-size: 36px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>💰 New Commission Earned!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${data.affiliateName}!</h2>
          <p>A customer you referred has made a payment, and you've earned a commission!</p>
          
          <div class="amount-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">You earned</div>
            <div class="commission">₹${commission}</div>
            <div style="font-size: 14px; color: #666; margin-top: 10px;">${rate}% commission</div>
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0;">Transaction Details</h3>
            <div class="detail-row">
              <span>Customer:</span>
              <strong>${data.customerName}</strong>
            </div>
            <div class="detail-row">
              <span>Transaction Amount:</span>
              <strong>₹${amount}</strong>
            </div>
            <div class="detail-row">
              <span>Your Commission:</span>
              <strong style="color: #10b981;">₹${commission}</strong>
            </div>
            <div class="detail-row">
              <span>Commission Rate:</span>
              <strong>${rate}%</strong>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span>Transaction ID:</span>
              <strong style="font-size: 12px;">${data.transactionId}</strong>
            </div>
          </div>
          
          <p>This commission is currently <strong>pending</strong> and will be included in your next payout.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" class="button">View Your Dashboard</a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Keep up the great work! Continue referring customers to earn more commissions.
          </p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `;

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: affiliateEmail,
        subject: `💰 New Commission: ₹${commission} Earned!`,
        html,
      });

      console.log('Transaction notification sent:', result);
      return { success: true, message: 'Transaction notification sent successfully' };
    } catch (error) {
      console.error('Failed to send transaction notification:', error);
      return { success: false, message: 'Failed to send transaction notification' };
    }
  }

  async sendPayoutCreatedEmail(
    affiliateEmail: string,
    data: {
      affiliateName: string;
      amountCents: number;
      commissionCount: number;
      payoutId: string;
      method?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const amount = (data.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payout Initiated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: white; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #3b82f6; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Payout Initiated!</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.affiliateName}!</h2>
          <p>Good news! A payout has been initiated for your earned commissions.</p>
          
          <div class="amount-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Payout Amount</div>
            <div class="amount">₹${amount}</div>
            <div style="margin-top: 15px;">
              <span class="status-badge">PENDING</span>
            </div>
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0;">Payout Details</h3>
            <p><strong>Commissions Included:</strong> ${data.commissionCount} commission${data.commissionCount > 1 ? 's' : ''}</p>
            ${data.method ? `<p><strong>Payment Method:</strong> ${data.method}</p>` : ''}
            <p><strong>Payout ID:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${data.payoutId}</code></p>
          </div>
          
          <p>Your payout is currently being processed. You'll receive another email once the payment has been completed.</p>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⏱️ Processing Time:</strong><br>
            Payouts typically take 3-5 business days to process, depending on the payment method.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" class="button">View Payout Status</a>
          </div>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Thank you for being a valued partner! Continue referring customers to earn more.
          </p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `;

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: affiliateEmail,
        subject: `🎉 Payout Initiated: ₹${amount}`,
        html,
      });

      console.log('Payout created notification sent:', result);
      return { success: true, message: 'Payout created notification sent successfully' };
    } catch (error) {
      console.error('Failed to send payout created notification:', error);
      return { success: false, message: 'Failed to send payout created notification' };
    }
  }

  async sendPayoutCompletedEmail(
    affiliateEmail: string,
    data: {
      affiliateName: string;
      amountCents: number;
      commissionCount: number;
      payoutId: string;
      method?: string;
      processedAt: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const amount = (data.amountCents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const date = new Date(data.processedAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Completed!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 36px; font-weight: bold; color: #10b981; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .celebration { font-size: 48px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Payment Completed!</h1>
        </div>
        <div class="content">
          <div class="celebration">🎊 🎉 🥳</div>
          
          <h2>Congratulations, ${data.affiliateName}!</h2>
          <p>Your payout has been successfully processed and the funds have been transferred.</p>
          
          <div class="amount-box">
            <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Amount Paid</div>
            <div class="amount">₹${amount}</div>
            <div style="margin-top: 15px;">
              <span class="status-badge">✓ COMPLETED</span>
            </div>
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Commissions Paid:</strong> ${data.commissionCount} commission${data.commissionCount > 1 ? 's' : ''}</p>
            ${data.method ? `<p><strong>Payment Method:</strong> ${data.method}</p>` : ''}
            <p><strong>Payment Date:</strong> ${date}</p>
            <p><strong>Payout ID:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${data.payoutId}</code></p>
          </div>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>✓ Payment Confirmed</strong><br>
            The funds should appear in your account within 1-2 business days, depending on your bank or payment provider.
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" class="button">View Dashboard</a>
          </div>
          
          <p style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            Keep up the excellent work! Continue referring customers to earn more commissions.
          </p>
          
          <p>Best regards,<br>The Refferq Team</p>
        </div>
      </body>
      </html>
      `;

      const result = await resend.emails.send({
        from: this.defaultFrom,
        to: affiliateEmail,
        subject: `✅ Payment Completed: ₹${amount} Paid!`,
        html,
      });

      console.log('Payout completed notification sent:', result);
      return { success: true, message: 'Payout completed notification sent successfully' };
    } catch (error) {
      console.error('Failed to send payout completed notification:', error);
      return { success: false, message: 'Failed to send payout completed notification' };
    }
  }
}

export const emailService = new EmailService();