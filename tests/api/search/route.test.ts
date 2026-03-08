import { GET } from '@/app/api/search/route';
import { searchProfiles } from '@/app/actions/search';

jest.mock('@/app/actions/search', () => ({
  searchProfiles: jest.fn(),
}));

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty results when submitted=false', async () => {
    const request = new Request('http://localhost:3000/api/search');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.results).toEqual([]);
    expect(searchProfiles).not.toHaveBeenCalled();
  });

  it('should return 400 when minAge is greater than maxAge', async () => {
    const request = new Request('http://localhost:3000/api/search?submitted=true&minAge=35&maxAge=20');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.errors.minAge).toBe('Minimum age cannot be greater than maximum age');
    expect(searchProfiles).not.toHaveBeenCalled();
  });

  it('should call searchProfiles with parsed filters', async () => {
    (searchProfiles as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
        targetGender: 'FEMALE',
        freeTier: {
          isPremium: false,
          dailyLimit: 5,
          viewedToday: 1,
          remaining: 4,
        },
      },
    });

    const request = new Request(
      'http://localhost:3000/api/search?submitted=true&minAge=25&maxAge=32&country=United%20Kingdom&page=2'
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(searchProfiles).toHaveBeenCalledWith({
      filters: {
        minAge: 25,
        maxAge: 32,
        country: 'United Kingdom',
        cityOrRegion: undefined,
        maritalStatus: undefined,
        practicingLevel: undefined,
        hijabOrBeard: undefined,
        smoking: undefined,
        education: undefined,
        profession: undefined,
        willingToRelocate: undefined,
      },
      page: 2,
      pageSize: undefined,
      sort: 'newest',
    });
  });

  it('should return 401 for unauthorized action response', async () => {
    (searchProfiles as jest.Mock).mockResolvedValue({
      success: false,
      errors: {
        general: 'Unauthorized',
      },
    });

    const request = new Request('http://localhost:3000/api/search?submitted=true');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('should treat blank and whitespace filters as any (undefined)', async () => {
    (searchProfiles as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        results: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        },
        targetGender: 'FEMALE',
        freeTier: {
          isPremium: false,
          dailyLimit: 5,
          viewedToday: 0,
          remaining: 5,
        },
      },
    });

    const request = new Request(
      'http://localhost:3000/api/search?submitted=true&minAge=%20%20&maxAge=&country=%20%20%20&cityOrRegion=%20'
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(searchProfiles).toHaveBeenCalledWith({
      filters: {
        minAge: undefined,
        maxAge: undefined,
        country: undefined,
        cityOrRegion: undefined,
        maritalStatus: undefined,
        practicingLevel: undefined,
        hijabOrBeard: undefined,
        smoking: undefined,
        education: undefined,
        profession: undefined,
        willingToRelocate: undefined,
      },
      page: undefined,
      pageSize: undefined,
      sort: 'newest',
    });
  });
});
