'use server';

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';

interface ActionResult {
  success: boolean;
  message?: string;
  errors?: { general?: string };
}

export interface PrivilegedUserRow {
  id: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MODERATOR';
  createdAt: string;
}

export async function getPrivilegedUsers(): Promise<{
  success: boolean;
  data?: PrivilegedUserRow[];
  errors?: { general?: string };
}> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS);

  if (!access.authorized) {
    return { success: false, errors: { general: 'Not authorized' } };
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SUPERADMIN', 'ADMIN', 'MODERATOR'] },
        adminAccount: { isNot: null },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role as 'SUPERADMIN' | 'ADMIN' | 'MODERATOR',
        createdAt: user.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch privileged users:', error);
    return { success: false, errors: { general: 'Failed to fetch users' } };
  }
}

export async function createPrivilegedUser(
  email: string,
  password: string,
  role: 'ADMIN' | 'MODERATOR'
): Promise<ActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS);

  if (!access.authorized || !access.userId || !access.role) {
    return { success: false, errors: { general: 'Not authorized' } };
  }

  if (!email || !password || password.length < 8) {
    return {
      success: false,
      errors: { general: 'Email and password (minimum 8 characters) are required' },
    };
  }

  if (role === 'ADMIN' && access.role !== 'SUPERADMIN') {
    return {
      success: false,
      errors: { general: 'Only superadmin can create admin users' },
    };
  }

  try {
    const [existingUser, existingAdminAccount, existingMemberAccount] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.adminAccount.findUnique({ where: { email }, select: { id: true } }),
      prisma.memberAccount.findUnique({ where: { email }, select: { id: true } }),
    ]);

    if (existingUser || existingAdminAccount || existingMemberAccount) {
      return { success: false, errors: { general: 'An account with this email already exists' } };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role,
          emailVerified: new Date(),
          adminAccount: {
            create: {
              email,
              passwordHash,
            },
          },
        },
      });

      await tx.moderationAuditLog.create({
        data: {
          actorId: access.userId,
          action: 'PRIVILEGED_USER_CREATED',
          targetType: 'User',
          targetId: user.id,
          metadata: {
            email,
            role,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return { success: true, message: `${role} account created successfully` };
  } catch (error) {
    console.error('Failed to create privileged user:', error);
    return { success: false, errors: { general: 'Failed to create account' } };
  }
}

export async function deletePrivilegedUser(targetUserId: string): Promise<ActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_MODERATOR_PERMISSIONS);

  if (!access.authorized || !access.userId || !access.role) {
    return { success: false, errors: { general: 'Not authorized' } };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
        adminAccount: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!targetUser || !targetUser.adminAccount) {
      return { success: false, errors: { general: 'Privileged user not found' } };
    }

    if (targetUser.role === 'SUPERADMIN') {
      return { success: false, errors: { general: 'Superadmin account cannot be deleted' } };
    }

    if (targetUser.id === access.userId) {
      return { success: false, errors: { general: 'You cannot delete your own account' } };
    }

    if (access.role === 'ADMIN' && targetUser.role !== 'MODERATOR') {
      return {
        success: false,
        errors: { general: 'Admins can only delete moderator accounts' },
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: targetUserId } });

      await tx.moderationAuditLog.create({
        data: {
          actorId: access.userId,
          action: 'PRIVILEGED_USER_DELETED',
          targetType: 'User',
          targetId: targetUserId,
          metadata: {
            email: targetUser.email,
            role: targetUser.role,
          } as Prisma.InputJsonValue,
        },
      });
    });

    return { success: true, message: `${targetUser.role} account deleted` };
  } catch (error) {
    console.error('Failed to delete privileged user:', error);
    return { success: false, errors: { general: 'Failed to delete user' } };
  }
}
