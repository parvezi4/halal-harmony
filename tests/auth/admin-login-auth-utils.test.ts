import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateAdminLogin } from '@/app/admin/login/auth-utils';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
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

  it('rejects missing users', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(validateAdminLogin('admin@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects invalid passwords', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
      role: 'ADMIN',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(validateAdminLogin('admin@example.com', 'wrong')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects member accounts on admin login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
      role: 'MEMBER',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('member@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'This account does not have admin privileges. Please use the regular login.',
    });
  });

  it('allows moderator accounts on admin login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      passwordHash: 'hashed-password',
      role: 'MODERATOR',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateAdminLogin('moderator@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });
});