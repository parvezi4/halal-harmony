import { NextResponse } from 'next/server';
import { getUnreadCount } from '@/app/actions/messages';

/**
 * GET /api/messages/unread
 * Returns unread message count for the current user
 */
export async function GET() {
  const result = await getUnreadCount();

  if (!result.success) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
