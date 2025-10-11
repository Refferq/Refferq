// Authentication and session management for the affiliate platform
import { type User, PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  private readonly SESSION_KEY = 'affiliate_platform_session';
  private readonly TOKEN_EXPIRY_HOURS = 24;

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private getExpiryDate(): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + this.TOKEN_EXPIRY_HOURS);
    return expiry.toISOString();
  }

  private generateReferralCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${cleanName.substr(0, 6)}-${random}`;
  }

  async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Determine initial status based on role
      // Affiliates start as PENDING and need admin approval
      // Admins start as ACTIVE (for initial setup)
      const userRoleLower = data.role.toLowerCase();
      const initialStatus = userRoleLower === 'admin' ? 'ACTIVE' : 'PENDING';

      // Create user
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
        message: 'Registration successful',
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; session?: AuthSession }> {
    try {
      // Call the login API route instead of direct database access
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, message: result.message };
      }

      // Create session from API response
      const session: AuthSession = {
        user: result.user,
        token: this.generateToken(),
        expiresAt: this.getExpiryDate(),
      };

      // Store session
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }

      return {
        success: true,
        message: 'Login successful',
        session,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  getCurrentUser(): User | null {
    try {
      if (typeof window === 'undefined') return null;

      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session: AuthSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.logout();
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: 'AFFILIATE' | 'ADMIN'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const { db } = await import('./prisma');

      // Get user
      const user = await db.getUserById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await db.updateUser(userId, { password: hashedPassword });

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, message: 'Password update failed' };
    }
  }
}

export const auth = new AuthService();