import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateAdminLogin } from '@/app/admin/login/auth-utils';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    adminAccount: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('validateAdminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing accounts', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(validateAdminLogin('admin@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects invalid passwords', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-account-1',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-1',
        role: 'ADMIN',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(validateAdminLogin('admin@example.com', 'wrong')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects non-privileged accounts on admin login', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-account-1',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-1',
        role: 'MEMBER',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('member@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'This account does not have admin privileges. Please use the regular login.',
    });
  });

  it('allows SUPERADMIN accounts on admin login', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-account-2',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-2',
        role: 'SUPERADMIN',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('admin@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });

  it('allows ADMIN accounts on admin login', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-account-3',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-3',
        role: 'ADMIN',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('ops.male@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });

  it('allows MODERATOR accounts on admin login', async () => {
    (prisma.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-account-4',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-4',
        role: 'MODERATOR',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('moderator.male@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });
});
