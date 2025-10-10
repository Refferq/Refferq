import { PrismaClient } from '@prisma/client';
import { resend } from './email';

const prisma = new PrismaClient();

export class OTPService {
  // Generate a 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate and send OTP via email
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return {
          success: false,
          message: 'No account found with this email address'
        };
      }

      // Check for recent OTP attempts (rate limiting)
      const recentOTP = await (prisma as any).OTP.findFirst({
        where: {
          email: email.toLowerCase(),
          createdAt: {
            gte: new Date(Date.now() - 60000) // Within last minute
          }
        }
      });

      if (recentOTP) {
        return {
          success: false,
          message: 'Please wait 1 minute before requesting another OTP'
        };
      }

      // Invalidate any existing unused OTPs for this email
      await (prisma as any).OTP.updateMany({
        where: {
          email: email.toLowerCase(),
          isUsed: false
        },
        data: {
          isUsed: true
        }
      });

      // Generate new OTP
      const code = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await (prisma as any).OTP.create({
        data: {
          email: email.toLowerCase(),
          code,
          expiresAt
        }
      });

      // Send OTP email
      const emailResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: 'Your Login Code',
        html: this.generateOTPEmailTemplate(code, user.name || 'User')
      });

      if (emailResult.error) {
        console.error('Failed to send OTP email:', emailResult.error);
        return {
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully to your email'
      };

    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'An error occurred while sending OTP'
      };
    }
  }

  // Verify OTP and return user if valid
  async verifyOTP(email: string, code: string): Promise<{
    success: boolean;
    user?: any;
    message: string;
  }> {
    try {
      // Find the OTP
      const otp = await (prisma as any).OTP.findFirst({
        where: {
          email: email.toLowerCase(),
          code,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!otp) {
        // Increment attempts for any existing OTP
        await (prisma as any).OTP.updateMany({
          where: {
            email: email.toLowerCase(),
            code,
            isUsed: false
          },
          data: {
            attempts: {
              increment: 1
            }
          }
        });

        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check attempts limit
      if (otp.attempts >= 3) {
        await (prisma as any).OTP.update({
          where: { id: otp.id },
          data: { isUsed: true }
        });

        return {
          success: false,
          message: 'Too many invalid attempts. Please request a new OTP.'
        };
      }

      // Mark OTP as used
      await (prisma as any).OTP.update({
        where: { id: otp.id },
        data: { isUsed: true }
      });

      // Get user details
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          affiliate: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        user,
        message: 'OTP verified successfully'
      };

    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'An error occurred while verifying OTP'
      };
    }
  }

  // Clean up expired OTPs (should be run periodically)
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await (prisma as any).OTP.deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lt: new Date()
              }
            },
            {
              isUsed: true,
              createdAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours old
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  // Generate OTP email template
  private generateOTPEmailTemplate(code: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Code</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .otp-code {
              background-color: #f3f4f6;
              border: 2px dashed #d1d5db;
              padding: 20px;
              text-align: center;
              margin: 30px 0;
              border-radius: 8px;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #1f2937;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 14px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${process.env.PLATFORM_NAME || 'Affiliate Platform'}</div>
              <h1>Your Login Code</h1>
            </div>
            
            <p>Hello ${userName},</p>
            <p>You requested to sign in to your account. Please use the verification code below:</p>
            
            <div class="otp-code">
              <div class="code">${code}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280;">This code expires in 10 minutes</p>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.
            </div>
            
            <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
            
            <div class="footer">
              <p>Best regards,<br>
              ${process.env.PLATFORM_NAME || 'Affiliate Platform'} Team</p>
              <p>
                Need help? Contact us at 
                <a href="mailto:${process.env.PLATFORM_SUPPORT_EMAIL}" style="color: #2563eb;">
                  ${process.env.PLATFORM_SUPPORT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const otpService = new OTPService();