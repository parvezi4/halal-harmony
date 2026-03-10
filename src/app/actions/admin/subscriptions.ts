'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { Prisma } from '@prisma/client';

export interface SubscriptionFilters {
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  search?: string; // Search by user email, name, or alias
  sortBy?: 'startDate' | 'endDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface SubscriptionResponse {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAlias: string;
  planName: string | null;
  planDescription: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  success: boolean;
  data?: {
    subscriptions: SubscriptionResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { general?: string };
}

export async function getSubscriptions(
  filters: SubscriptionFilters = {}
): Promise<PaginatedResponse> {
  const { authorized } = await verifyAdminOrModerator(
    ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS
  );

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized to view subscriptions' },
    };
  }

  try {
    const {
      status,
      search,
      sortBy = 'startDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: Prisma.SubscriptionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          user: {
            profile: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            profile: {
              alias: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Get total count
    const total = await prisma.subscription.count({ where });

    // Get paginated subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                alias: true,
              },
            },
          },
        },
        plan: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const now = new Date();
    const data = subscriptions.map((sub) => {
      const daysRemaining = Math.max(
        0,
        Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        id: sub.id,
        userId: sub.userId,
        userName: sub.user.profile?.fullName || 'N/A',
        userEmail: sub.user.email,
        userAlias: sub.user.profile?.alias || 'N/A',
        planName: sub.plan?.name || null,
        planDescription: sub.plan?.description || null,
        status: sub.status,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        daysRemaining,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        subscriptions: data,
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch subscriptions' },
    };
  }
}

export async function getSubscriptionStats() {
  const { authorized } = await verifyAdminOrModerator(
    ADMIN_CAPABILITIES.INSPECT_SUBSCRIPTIONS
  );

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const [totalActive, totalExpired, totalCancelled, totalSubscriptions] =
      await Promise.all([
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'EXPIRED' } }),
        prisma.subscription.count({ where: { status: 'CANCELLED' } }),
        prisma.subscription.count(),
      ]);

    return {
      success: true,
      data: {
        totalActive,
        totalExpired,
        totalCancelled,
        totalSubscriptions,
      },
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch stats' },
    };
  }
}
