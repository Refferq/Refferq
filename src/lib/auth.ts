
import { t as __tr } from "@/i18n";
// Authentication and session management for the affiliate platform
import { type User, Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string; // 'affiliate' or 'admin' from the form
}

class AuthService {
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateReferralCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    return `${cleanName.substr(0, 6)}-${random}`;
  }

  /**
   * Register a new user and create their profile.
   * This is a server-side only method.
   */
  async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return { success: false, message: __tr("User already exists with this email") };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Determine initial status based on role
      const userRoleLower = data.role.toLowerCase();
      const initialStatus = userRoleLower === 'admin' ? 'ACTIVE' : 'PENDING';

      // Create user using prisma client directly or db service
      // We'll use prisma client here since we've already hashed the password
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword,
          role: data.role.toUpperCase() as Role,
          status: initialStatus as UserStatus
        }
      });

      // If affiliate, create affiliate record
      if (userRoleLower === 'affiliate') {
        const referralCode = this.generateReferralCode(data.name);

        await prisma.affiliate.create({
          data: {
            userId: user.id,
            referralCode,
            payoutDetails: {},
            balanceCents: 0
          }
        });
      }

      return {
        success: true,
        message: __tr("Registration successful"),
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: __tr("Registration failed") };
    }
  }

  /**
   * Update a user's password.
   * Server-side only.
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: __tr("User not found") };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, message: __tr("Current password is incorrect") };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      return { success: true, message: __tr("Password updated successfully") };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: __tr("Password update failed") };
    }
  }
}

export const auth = new AuthService();
