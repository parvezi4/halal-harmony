import { NextResponse } from 'next/server';
import { getFavorites, toggleFavorite } from '@/app/actions/favorites';

export async function GET() {
  const result = await getFavorites();

  if (!result.success) {
    const status = result.errors?.general === 'Unauthorized' ? 401 : 403;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { targetUserId?: string };
    const targetUserId = body.targetUserId;

    if (!targetUserId) {
      return NextResponse.json(
        {
          success: false,
          errors: { targetUserId: 'Target user is required' },
        },
        { status: 400 }
      );
    }

    const result = await toggleFavorite(targetUserId);

    if (!result.success) {
      const status = result.errors?.general === 'Unauthorized' ? 401 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/favorites:', error);
    return NextResponse.json(
      {
        success: false,
        errors: {
          general: 'Unable to update favorite',
        },
      },
      { status: 500 }
    );
  }
}
