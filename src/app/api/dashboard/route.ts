import { NextResponse } from 'next/server';
import { getDashboardData } from '@/app/actions/dashboard';

/**
 * GET /api/dashboard
 *
 * Returns dashboard data for the authenticated user, including:
 * - User name and member since date
 * - Subscription status
 * - Profile completeness (percentage based on mandatory + optional fields)
 * - Message statistics (unread conversations, total active threads)
 * - Match count
 *
 * Requires: Valid NextAuth session (authentication handled by middleware)
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "userName": "string",
 *     "memberSinceDate": "string (formatted)",
 *     "memberSinceDateFull": "ISO date string",
 *     "subscriptionStatus": "free|active|expired|cancelled",
 *     "subscriptionEndDate": "ISO date string (optional)",
 *     "profileCompleteness": {
 *       "percentage": number (0-100),
 *       "completedFields": number,
 *       "totalFields": number,
 *       "mandatory": { "completed": number, "total": number },
 *       "optional": { "completed": number, "total": number }
 *     },
 *     "messages": {
 *       "unreadConversations": number,
 *       "totalActiveThreads": number
 *     },
 *     "matchCount": number
 *   }
 * }
 *
 * Response (401): Unauthorized
 * {
 *   "success": false,
 *   "errors": { "general": "Unauthorized" }
 * }
 *
 * Response (500): Server error
 * {
 *   "success": false,
 *   "errors": { "general": "Failed to fetch dashboard data" }
 * }
 */
export async function GET() {
  try {
    const result = await getDashboardData();

    if (!result.success) {
      return NextResponse.json(result, {
        status: result.errors?.general === 'Unauthorized' ? 401 : 500,
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: { general: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
