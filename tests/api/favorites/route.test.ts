import { GET, POST } from '@/app/api/favorites/route';
import { getFavorites, toggleFavorite } from '@/app/actions/favorites';

jest.mock('@/app/actions/favorites', () => ({
  getFavorites: jest.fn(),
  toggleFavorite: jest.fn(),
}));

describe('/api/favorites route handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET should return favorites list', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        favorites: [
          {
            userId: 'user-2',
            alias: 'Fatima',
            country: 'United Kingdom',
            cityOrRegion: 'Manchester',
          },
        ],
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.favorites).toHaveLength(1);
    expect(getFavorites).toHaveBeenCalled();
  });

  it('GET should return 401 when unauthorized', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('GET should return 403 for non-unauthorized failures', async () => {
    (getFavorites as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Complete onboarding to use favorites' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('POST should return 400 when targetUserId is missing', async () => {
    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it('POST should toggle favorite', async () => {
    (toggleFavorite as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Added to favorites',
      data: {
        targetUserId: 'user-2',
        isFavorited: true,
      },
    });

    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'user-2' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(toggleFavorite).toHaveBeenCalledWith('user-2');
  });

  it('POST should return 401 when action reports unauthorized', async () => {
    (toggleFavorite as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'user-2' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('POST should return 400 for business-rule errors', async () => {
    (toggleFavorite as jest.Mock).mockResolvedValue({
      success: false,
      errors: { targetUserId: 'Profile is not searchable' },
    });

    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'user-2' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST should return 500 for malformed JSON payload', async () => {
    const request = new Request('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.errors?.general).toBe('Unable to update favorite');
  });
});
