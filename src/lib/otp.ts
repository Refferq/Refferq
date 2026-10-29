import { prisma } from './prisma';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_INTERVAL_MS = 60 * 1000;

export function normalizeAffiliateEmail(value: string): string {
  return value.trim().toLowerCase();
}

// A keyed hash makes the database insufficient to recover a six-digit OTP.
export function hashOtp(email: string, code: string, key: string): string {
  return createHmac('sha256', key).update(normalizeAffiliateEmail(email) + ':' + code).digest('hex');
}

export class OTPService {
  async sendOTP(rawEmail: string): Promise<{ success: boolean; message: string }> {
    const email = normalizeAffiliateEmail(rawEmail);
    const settingsOk = Boolean(process.env.JWT_SECRET && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
    if (!settingsOk) return { success: false, message: 'Email service not configured' };

    const user = await prisma.user.findUnique({ where: { email } });
    // A uniform response prevents public enumeration of member emails.
    const generic = { success: true, message: 'If eligible, a verification code has been sent.' };
    if (!user || user.status === 'INACTIVE' || user.status === 'SUSPENDED' ||
        (user.status === 'PENDING' && user.emailVerifiedAt)) return generic;

    const recent = await prisma.otp.findFirst({
      where: { email, createdAt: { gte: new Date(Date.now() - RESEND_INTERVAL_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) return { success: false, message: 'Please wait one minute before requesting another code.' };

    const code = randomInt(100000, 1000000).toString();
    const otp = await prisma.$transaction(async tx => {
      await tx.otp.updateMany({ where: { email, isUsed: false }, data: { isUsed: true } });
      return tx.otp.create({ data: {
        email,
        code: hashOtp(email, code, process.env.JWT_SECRET!),
        expiresAt: new Date(Date.now() + CODE_LIFETIME_MS),
      } });
    });
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const name = user.name.replace(/[&<>"']/g, '');
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: 'Herbal Vitaly — Your verification code',
        text: `Hello ${name}, your Herbal Vitaly Affiliate verification code is ${code}. It expires in 10 minutes. Never share this code.`,
      });
      if (result.error) throw new Error('Resend rejected OTP');
      return generic;
    } catch {
      await prisma.otp.updateMany({ where: { id: otp.id }, data: { isUsed: true } });
      return { success: false, message: 'Unable to send verification code. Please try again later.' };
    }
  }

  async verifyOTP(rawEmail: string, code: string): Promise<{
    success: boolean; message: string; user?: Awaited<ReturnType<typeof prisma.user.findUnique>>; pendingApproval?: boolean
  }> {
    const email = normalizeAffiliateEmail(rawEmail);
    if (!/^\d{6}$/.test(code) || !process.env.JWT_SECRET) {
      return { success: false, message: 'Invalid or expired code' };
    }
    const current = await prisma.otp.findFirst({
      where: { email, isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!current || current.attempts >= MAX_ATTEMPTS) {
      return { success: false, message: 'Invalid or expired code' };
    }
    const candidate = Buffer.from(hashOtp(email, code, process.env.JWT_SECRET), 'hex');
    const saved = Buffer.from(current.code, 'hex');
    const equal = saved.length === candidate.length && timingSafeEqual(saved, candidate);
    if (!equal) {
      await prisma.otp.updateMany({
        where: { id: current.id, isUsed: false, attempts: { lt: MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
      return { success: false, message: 'Invalid or expired code' };
    }
    const consumed = await prisma.otp.updateMany({
      where: { id: current.id, isUsed: false, attempts: { lt: MAX_ATTEMPTS }, expiresAt: { gt: new Date() } },
      data: { isUsed: true },
    });
    if (consumed.count !== 1) return { success: false, message: 'Invalid or expired code' };
    const user = await prisma.user.findUnique({ where: { email }, include: { affiliate: true } });
    if (!user || (user.status !== 'PENDING' && user.status !== 'ACTIVE')) {
      return { success: false, message: 'Account unavailable' };
    }
    if (user.status === 'PENDING') {
      // One-time administrator onboarding: the address must be pre-provisioned
      // in Neon as ADMIN and explicitly listed in the server-only allowlist.
      if (user.role === 'ADMIN') {
        const authorizedEmails = (process.env.ADMIN_EMAILS || '')
          .split(',').map(v => normalizeAffiliateEmail(v)).filter(Boolean);
        if (!authorizedEmails.includes(email)) {
          return { success: false, message: 'Administrator onboarding is not authorized.' };
        }
        await prisma.user.updateMany({
          where: { id: user.id, status: 'PENDING', role: 'ADMIN' },
          data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
        });
        const approved = await prisma.user.findUnique({ where: { id: user.id }, include: { affiliate: true } });
        if (!approved || approved.status !== 'ACTIVE')
          return { success: false, message: 'Unable to activate administrator' };
        return { success: true, message: 'Administrator email verified', user: approved };
      }
      await prisma.user.updateMany({
        where: { id: user.id, emailVerifiedAt: null, status: 'PENDING', role: 'AFFILIATE' },
        data: { emailVerifiedAt: new Date() },
      });
      return { success: true, message: 'Email verified. Your application awaits administrator approval.', pendingApproval: true };
    }
    return { success: true, message: 'Verification successful', user };
  }
}

export const otpService = new OTPService();
