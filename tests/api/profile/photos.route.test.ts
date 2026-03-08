import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// Import route handlers after mocks are initialized.
let routeModule: typeof import('../../../src/app/api/profile/photos/route');

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/auth', () => ({
  authOptions: {},
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
    },
    photo: {
      updateMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('/api/profile/photos route handlers', () => {
  beforeAll(async () => {
    routeModule = await import('../../../src/app/api/profile/photos/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET should return 401 when user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await routeModule.GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('PATCH should set a photo as primary', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

    (prisma.profile.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'profile-1',
        photos: [
          { id: 'photo-a', isPrimary: true },
          { id: 'photo-b', isPrimary: false },
        ],
      })
      .mockResolvedValueOnce({
        id: 'profile-1',
        photos: [{ id: 'photo-b', isPrimary: true }],
      });

    (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

    const request = new Request('http://localhost:3000/api/profile/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: 'photo-b' }),
    });

    const response = await routeModule.PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.photo.updateMany).toHaveBeenCalledWith({
      where: { profileId: 'profile-1' },
      data: { isPrimary: false },
    });
    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: 'photo-b' },
      data: { isPrimary: true },
    });
    expect(body.success).toBe(true);
    expect(body.message).toBe('Primary photo updated');
  });

  it('DELETE should remove photo and reassign primary if needed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });

    (prisma.profile.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'profile-1',
        photos: [
          { id: 'photo-a', isPrimary: true, url: '/uploads/user-1/photo-a.jpg' },
          { id: 'photo-b', isPrimary: false, url: '/uploads/user-1/photo-b.jpg' },
        ],
      })
      .mockResolvedValueOnce({
        id: 'profile-1',
        photos: [{ id: 'photo-b', isPrimary: true, url: '/uploads/user-1/photo-b.jpg' }],
      });

    (prisma.photo.findMany as jest.Mock).mockResolvedValue([
      { id: 'photo-b', isPrimary: false, url: '/uploads/user-1/photo-b.jpg' },
    ]);
    (prisma.photo.delete as jest.Mock).mockResolvedValue({ id: 'photo-a' });
    (prisma.photo.update as jest.Mock).mockResolvedValue({ id: 'photo-b', isPrimary: true });

    const request = new Request('http://localhost:3000/api/profile/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: 'photo-a' }),
    });

    const response = await routeModule.DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 'photo-a' } });
    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: 'photo-b' },
      data: { isPrimary: true },
    });
    expect(body.success).toBe(true);
    expect(body.message).toBe('Photo deleted');
  });

  it('DELETE should return 404 when photo does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'user-1' } });
    (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-1',
      photos: [{ id: 'photo-a', isPrimary: true, url: '/uploads/user-1/photo-a.jpg' }],
    });

    const request = new Request('http://localhost:3000/api/profile/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId: 'missing-photo' }),
    });

    const response = await routeModule.DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Photo not found');
  });
});
