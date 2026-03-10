import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export type LoginType = 'admin' | 'user';

interface SignInResult {
  success: boolean;
  error?: string;
}

/**
 * Sign in a user and validate their role matches the login type
 * @param email - User email
 * @param password - User password
 * @param loginType - 'admin' (requires ADMIN/MODERATOR) or 'user' (requires MEMBER)
 */
export async function signIn(
  email: string,
  password: string,
  loginType: LoginType
): Promise<SignInResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, role: true },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Validate role based on login type
    if (loginType === 'admin') {
      if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        return {
          success: false,
          error: 'This account does not have admin privileges. Please use the regular login.',
        };
      }
    } else if (loginType === 'user') {
      if (user.role !== 'MEMBER') {
        return {
          success: false,
          error: 'This account is an admin account. Please use the admin login.',
        };
      }
    }

    // Call NextAuth signIn with the validated user
    // Note: This is a server-side operation, we're just validating here
    // The actual session creation happens via NextAuth
    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
