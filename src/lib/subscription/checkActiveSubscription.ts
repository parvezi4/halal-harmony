import { prisma } from '@/lib/prisma';

/**
 * Check if a user has an active subscription
 * @param userId - The user ID to check
 * @returns Object with isPremium boolean and optional subscription details
 */
export async function checkActiveSubscription(userId: string) {
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      endDate: {
        gt: new Date(),
      },
    },
    include: {
      plan: true,
    },
  });

  return {
    isPremium: Boolean(activeSubscription),
    subscription: activeSubscription,
  };
}

/**
 * Check if at least one user in a pair has an active subscription
 * @param userAId - First user ID
 * @param userBId - Second user ID
 * @returns True if at least one has active subscription
 */
export async function checkEitherHasSubscription(
  userAId: string,
  userBId: string
): Promise<boolean> {
  const [userA, userB] = await Promise.all([
    checkActiveSubscription(userAId),
    checkActiveSubscription(userBId),
  ]);

  return userA.isPremium || userB.isPremium;
}
