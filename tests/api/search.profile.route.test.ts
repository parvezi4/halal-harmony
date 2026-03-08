import { GET } from '@/app/api/search/profile/[userId]/route';
import { getSearchProfileDetail } from '@/app/actions/search';

jest.mock('@/app/actions/search', () => ({
  getSearchProfileDetail: jest.fn(),
}));

describe('GET /api/search/profile/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns profile detail when found', async () => {
    (getSearchProfileDetail as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        userId: 'target-1',
        profileId: 'profile-1',
        alias: 'Fatima',
        age: 28,
        ageRangeLabel: null,
        country: 'United Kingdom',
        city: 'Manchester',
        region: null,
        nationality: null,
        ethnicity: null,
        practicingLevel: 'Practicing',
        prayerHabit: '5 times daily',
        madhhabOrManhaj: 'Hanafi',
        hijabOrBeard: 'Hijab',
        smoking: false,
        maritalStatus: 'virgin',
        numberOfChildren: 0,
        willingToRelocate: 'maybe',
        relocateNotes: null,
        education: 'BSc',
        profession: 'Teacher',
        about: 'About',
        familyBackground: 'Family background',
        preferences: 'Preferences',
        photos: [],
        isFavorited: false,
        freeTier: {
          isPremium: false,
          dailyLimit: 5,
          viewedToday: 1,
          remaining: 4,
        },
      },
    });

    const response = await GET(new Request('http://localhost:3000/api/search/profile/target-1'), {
      params: Promise.resolve({ userId: 'target-1' }),
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(getSearchProfileDetail).toHaveBeenCalledWith('target-1');
  });

  it('returns 401 for unauthorized access', async () => {
    (getSearchProfileDetail as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const response = await GET(new Request('http://localhost:3000/api/search/profile/target-1'), {
      params: Promise.resolve({ userId: 'target-1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 404 for unavailable profile', async () => {
    (getSearchProfileDetail as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Profile is not available in search' },
    });

    const response = await GET(new Request('http://localhost:3000/api/search/profile/target-2'), {
      params: Promise.resolve({ userId: 'target-2' }),
    });

    expect(response.status).toBe(404);
  });
});
