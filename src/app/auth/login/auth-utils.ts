import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

interface SignInResult {
  success: boolean;
  error?: string;
}

export async function validateUserLogin(email: string, password: string): Promise<SignInResult> {
  try {
    const memberAccount = await prisma.memberAccount.findUnique({
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

    if (!memberAccount) {
      return { success: false, error: 'Invalid email or password' };
    }

    const validPassword = await bcrypt.compare(password, memberAccount.passwordHash);
    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (memberAccount.user.role !== 'MEMBER') {
      return {
        success: false,
        error: 'This account is not available in member login.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
