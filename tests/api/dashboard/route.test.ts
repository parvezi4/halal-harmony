import { GET } from '@/app/api/dashboard/route';
import { getDashboardData } from '@/app/actions/dashboard';

jest.mock('@/app/actions/dashboard');

describe('GET /api/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard data successfully when user is authenticated', async () => {
    const mockData = {
      userName: 'Ahmed',
      memberSinceDate: '5 Mar 2026',
      memberSinceDateFull: new Date('2026-03-05'),
      subscriptionStatus: 'active' as const,
      subscriptionEndDate: new Date('2027-03-05'),
      profileCompleteness: {
        percentage: 85,
        completedFields: 15,
        totalFields: 18,
        mandatory: { completed: 12, total: 12 },
        optional: { completed: 3, total: 6 },
      },
      messages: {
        unreadConversations: 2,
        totalActiveThreads: 5,
      },
      matchCount: 24,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.userName).toBe('Ahmed');
    expect(json.data.memberSinceDate).toBe('5 Mar 2026');
    expect(json.data.subscriptionStatus).toBe('active');
    expect(json.data.profileCompleteness.percentage).toBe(85);
    expect(json.data.profileCompleteness.completedFields).toBe(15);
    expect(json.data.profileCompleteness.totalFields).toBe(18);
  });

  it('should verify completeness % based on total (mandatory + optional) fields', async () => {
    const mockData = {
      userName: 'Fatima',
      memberSinceDate: '1 Jan 2026',
      memberSinceDateFull: new Date('2026-01-01'),
      subscriptionStatus: 'free' as const,
      profileCompleteness: {
        percentage: 76, // (13 / 17) * 100 ≈ 76%
        completedFields: 13,
        totalFields: 17,
        mandatory: { completed: 10, total: 12 },
        optional: { completed: 3, total: 5 },
      },
      messages: {
        unreadConversations: 0,
        totalActiveThreads: 0,
      },
      matchCount: 15,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    // Verify calculation: (completedFields / totalFields) * 100
    const expectedPercentage = Math.round(
      (mockData.profileCompleteness.completedFields / mockData.profileCompleteness.totalFields) *
        100
    );
    expect(json.data.profileCompleteness.percentage).toBe(expectedPercentage);
    expect(json.data.profileCompleteness.totalFields).toBe(
      mockData.profileCompleteness.mandatory.total + mockData.profileCompleteness.optional.total
    );
  });

  it('should return 100% when all mandatory and optional fields completed', async () => {
    const mockData = {
      userName: 'Ali',
      memberSinceDate: '10 Feb 2026',
      memberSinceDateFull: new Date('2026-02-10'),
      subscriptionStatus: 'active' as const,
      profileCompleteness: {
        percentage: 100,
        completedFields: 18,
        totalFields: 18,
        mandatory: { completed: 12, total: 12 },
        optional: { completed: 6, total: 6 },
      },
      messages: {
        unreadConversations: 3,
        totalActiveThreads: 8,
      },
      matchCount: 42,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.profileCompleteness.percentage).toBe(100);
  });

  it('should return 0 when no fields are completed', async () => {
    const mockData = {
      userName: 'user@example.com',
      memberSinceDate: '8 Mar 2026',
      memberSinceDateFull: new Date('2026-03-08'),
      subscriptionStatus: 'free' as const,
      profileCompleteness: {
        percentage: 0,
        completedFields: 0,
        totalFields: 18,
        mandatory: { completed: 0, total: 12 },
        optional: { completed: 0, total: 6 },
      },
      messages: {
        unreadConversations: 0,
        totalActiveThreads: 0,
      },
      matchCount: 0,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.profileCompleteness.percentage).toBe(0);
  });

  it('should return 401 Unauthorized when user is not authenticated', async () => {
    (getDashboardData as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Unauthorized' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.errors.general).toBe('Unauthorized');
  });

  it('should handle free vs premium subscription status', async () => {
    const freeData = {
      userName: 'FreeMember',
      memberSinceDate: '1 Mar 2026',
      memberSinceDateFull: new Date('2026-03-01'),
      subscriptionStatus: 'free' as const,
      profileCompleteness: {
        percentage: 50,
        completedFields: 9,
        totalFields: 18,
        mandatory: { completed: 6, total: 12 },
        optional: { completed: 3, total: 6 },
      },
      messages: {
        unreadConversations: 1,
        totalActiveThreads: 2,
      },
      matchCount: 30,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: freeData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.subscriptionStatus).toBe('free');
    expect(json.data.subscriptionEndDate).toBeUndefined();
  });

  it('should handle subscription expiry status', async () => {
    const expiredData = {
      userName: 'ExpiredUser',
      memberSinceDate: '1 Jan 2026',
      memberSinceDateFull: new Date('2026-01-01'),
      subscriptionStatus: 'expired' as const,
      subscriptionEndDate: new Date('2026-03-01'),
      profileCompleteness: {
        percentage: 60,
        completedFields: 11,
        totalFields: 18,
        mandatory: { completed: 10, total: 12 },
        optional: { completed: 1, total: 6 },
      },
      messages: {
        unreadConversations: 0,
        totalActiveThreads: 1,
      },
      matchCount: 18,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: expiredData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.subscriptionStatus).toBe('expired');
    expect(json.data.subscriptionEndDate).toBe('2026-03-01T00:00:00.000Z');
  });

  it('should return message statistics correctly', async () => {
    const mockData = {
      userName: 'MessageUser',
      memberSinceDate: '15 Feb 2026',
      memberSinceDateFull: new Date('2026-02-15'),
      subscriptionStatus: 'active' as const,
      profileCompleteness: {
        percentage: 72,
        completedFields: 12,
        totalFields: 18,
        mandatory: { completed: 10, total: 12 },
        optional: { completed: 2, total: 6 },
      },
      messages: {
        unreadConversations: 5,
        totalActiveThreads: 12,
      },
      matchCount: 50,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.messages.unreadConversations).toBe(5);
    expect(json.data.messages.totalActiveThreads).toBe(12);
  });

  it('should return match count from database', async () => {
    const mockData = {
      userName: 'TestUser',
      memberSinceDate: '8 Mar 2026',
      memberSinceDateFull: new Date('2026-03-08'),
      subscriptionStatus: 'active' as const,
      profileCompleteness: {
        percentage: 80,
        completedFields: 14,
        totalFields: 18,
        mandatory: { completed: 11, total: 12 },
        optional: { completed: 3, total: 6 },
      },
      messages: {
        unreadConversations: 2,
        totalActiveThreads: 4,
      },
      matchCount: 37,
    };

    (getDashboardData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const response = await GET();
    const json = await response.json();

    expect(json.data.matchCount).toBe(37);
  });

  it('should handle server errors gracefully', async () => {
    (getDashboardData as jest.Mock).mockResolvedValue({
      success: false,
      errors: { general: 'Failed to fetch dashboard data' },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
