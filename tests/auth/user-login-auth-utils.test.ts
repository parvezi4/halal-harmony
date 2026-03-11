import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateUserLogin } from '@/app/auth/login/auth-utils';

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

describe('validateUserLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid passwords', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hashed-password',
      role: 'MEMBER',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(validateUserLogin('member@example.com', 'wrong')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects admin accounts on user login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      passwordHash: 'hashed-password',
      role: 'ADMIN',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateUserLogin('admin@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'This account is an admin account. Please use the admin login at /admin/login.',
    });
  });

  it('allows member accounts on user login', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-3',
      passwordHash: 'hashed-password',
      role: 'MEMBER',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateUserLogin('member@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });
});
