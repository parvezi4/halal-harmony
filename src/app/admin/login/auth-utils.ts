import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

interface SignInResult {
  success: boolean;
  error?: string;
}

export async function validateAdminLogin(email: string, password: string): Promise<SignInResult> {
  try {
    const adminAccount = await prisma.adminAccount.findUnique({
      where: { email },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!adminAccount) {
      return { success: false, error: 'Invalid email or password' };
    }

    const validPassword = await bcrypt.compare(password, adminAccount.passwordHash);
    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (
      adminAccount.user.role !== 'SUPERADMIN' &&
      adminAccount.user.role !== 'ADMIN' &&
      adminAccount.user.role !== 'MODERATOR'
    ) {
      return {
        success: false,
        error: 'This account does not have admin privileges. Please use the regular login.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
