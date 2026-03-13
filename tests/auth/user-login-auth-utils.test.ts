import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateUserLogin } from '@/app/auth/login/auth-utils';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    memberAccount: {
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

  it('rejects missing accounts', async () => {
    (prisma.memberAccount.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(validateUserLogin('member@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects invalid passwords', async () => {
    (prisma.memberAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'member-account-1',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-1',
        role: 'MEMBER',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(validateUserLogin('member@example.com', 'wrong')).resolves.toEqual({
      success: false,
      error: 'Invalid email or password',
    });
  });

  it('rejects non-member accounts in member login domain', async () => {
    (prisma.memberAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'member-account-2',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-2',
        role: 'ADMIN',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateUserLogin('admin@example.com', 'Password123!')).resolves.toEqual({
      success: false,
      error: 'This account is not available in member login.',
    });
  });

  it('allows member accounts on user login', async () => {
    (prisma.memberAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'member-account-3',
      passwordHash: 'hashed-password',
      user: {
        id: 'user-3',
        role: 'MEMBER',
      },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(validateUserLogin('member@example.com', 'Password123!')).resolves.toEqual({
      success: true,
    });
  });
});
