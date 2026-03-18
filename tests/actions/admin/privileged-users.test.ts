import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import {
  createPrivilegedUser,
  getPrivilegedUsers,
} from '@/app/actions/admin/privileged-users';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('@/lib/admin/access', () => ({
  verifyAdminOrModerator: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    adminAccount: {
      findUnique: jest.fn(),
    },
    memberAccount: {
      findUnique: jest.fn(),
    },
    moderationAuditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockVerifyAdminOrModerator = verifyAdminOrModerator as jest.Mock;
const mockTx = prisma.$transaction as jest.Mock;

describe('Privileged User Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTx.mockImplementation(async (callback) =>
      callback({
        user: {
          create: prisma.user.create,
          delete: prisma.user.delete,
        },
        moderationAuditLog: {
          create: prisma.moderationAuditLog.create,
        },
      })
    );
  });

  it('returns users with persisted gender', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: true,
      userId: 'superadmin-1',
      role: 'SUPERADMIN',
      staffGender: 'MALE',
    });

    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'admin-1',
        email: 'ops.admin@example.com',
        role: 'ADMIN',
        createdAt: new Date('2026-03-18T08:00:00Z'),
        adminAccount: {
          gender: 'MALE',
        },
      },
      {
        id: 'mod-1',
        email: 'moderator@example.com',
        role: 'MODERATOR',
        createdAt: new Date('2026-03-18T09:00:00Z'),
        adminAccount: {
          gender: 'FEMALE',
        },
      },
    ]);

    const result = await getPrivilegedUsers();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      {
        id: 'admin-1',
        email: 'ops.admin@example.com',
        role: 'ADMIN',
        gender: 'MALE',
        createdAt: '2026-03-18T08:00:00.000Z',
      },
      {
        id: 'mod-1',
        email: 'moderator@example.com',
        role: 'MODERATOR',
        gender: 'FEMALE',
        createdAt: '2026-03-18T09:00:00.000Z',
      },
    ]);
  });

  it('requires gender when creating privileged users', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: true,
      userId: 'superadmin-1',
      role: 'SUPERADMIN',
      staffGender: 'MALE',
    });

    const result = await createPrivilegedUser(
      'new.moderator@example.com',
      'Password123!',
      'MODERATOR',
      '' as never
    );

    expect(result.success).toBe(false);
    expect(result.errors?.general).toContain('gender');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('persists gender when creating privileged users', async () => {
    mockVerifyAdminOrModerator.mockResolvedValue({
      authorized: true,
      userId: 'superadmin-1',
      role: 'SUPERADMIN',
      staffGender: 'MALE',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.memberAccount.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new-mod-user-id' });
    (prisma.moderationAuditLog.create as jest.Mock).mockResolvedValue({});

    const result = await createPrivilegedUser(
      'new.moderator@example.com',
      'Password123!',
      'MODERATOR',
      'FEMALE'
    );

    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new.moderator@example.com',
          role: 'MODERATOR',
          adminAccount: {
            create: expect.objectContaining({
              gender: 'FEMALE',
            }),
          },
        }),
      })
    );
  });
});
