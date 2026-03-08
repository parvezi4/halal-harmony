'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calculateProfileCompleteness } from '@/lib/profile/completeness';

export type DashboardResponse = {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
  data?: {
    userName: string;
    memberSinceDate: string;
    memberSinceDateFull: Date;
    subscriptionStatus: 'free' | 'active' | 'expired' | 'cancelled';
    subscriptionEndDate?: Date;
    profileCompleteness: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      mandatory: {
        completed: number;
        total: number;
      };
      optional: {
        completed: number;
        total: number;
      };
    };
    messages: {
      unreadConversations: number;
      totalActiveThreads: number;
    };
    matchCount: number;
  };
};

/**
 * Calculate profile completeness percentage and fetch dashboard data
 */
export async function getDashboardData(): Promise<DashboardResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, errors: { general: 'Unauthorized' } };
    }

    const userId = session.user.id;

    // Fetch user with profile and relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            photos: true,
          },
        },
        subscriptions: {
          where: {
            status: {
              in: ['ACTIVE', 'EXPIRED'],
            },
          },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
        threadsA: true,
        threadsB: true,
      },
    });

    if (!user) {
      return { success: false, errors: { general: 'User not found' } };
    }

    const profile = user.profile;
    if (!profile) {
      return { success: false, errors: { general: 'Profile not found' } };
    }

    // Format member since date
    const memberSinceDate = user.createdAt.toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Determine subscription status
    let subscriptionStatus: 'free' | 'active' | 'expired' | 'cancelled' = 'free';
    let subscriptionEndDate: Date | undefined;

    if (user.subscriptions.length > 0) {
      const currentSub = user.subscriptions[0];
      subscriptionStatus = currentSub.status === 'ACTIVE' ? 'active' : 'expired';
      subscriptionEndDate = currentSub.endDate;
    }

    // Calculate profile completeness
    const completenessCalc = calculateProfileCompleteness(profile);

    // Count message threads and unread messages
    const allThreads = [...user.threadsA, ...user.threadsB];
    const totalActiveThreads = allThreads.length;

    // Count unread messages
    const unreadMessages = await prisma.message.count({
      where: {
        thread: {
          OR: [
            { participantAId: userId },
            { participantBId: userId },
          ],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });

    // Estimate match count (basic - users who match gender preference and are approved)
    // This is a simplified version - can be enhanced with actual matching logic
    const oppositeGender = profile.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const matchCount = await prisma.profile.count({
      where: {
        userId: { not: userId },
        gender: oppositeGender,
        status: 'APPROVED',
      },
    });

    // Get user display name
    const userName = profile.alias || profile.fullName || user.email.split('@')[0] || 'Member';

    return {
      success: true,
      data: {
        userName,
        memberSinceDate,
        memberSinceDateFull: user.createdAt,
        subscriptionStatus,
        subscriptionEndDate,
        profileCompleteness: completenessCalc,
        messages: {
          unreadConversations: unreadMessages > 0 ? Math.min(unreadMessages, totalActiveThreads) : 0,
          totalActiveThreads,
        },
        matchCount,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, errors: { general: 'Failed to fetch dashboard data' } };
  }
}

