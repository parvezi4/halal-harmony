import { NextResponse } from 'next/server';
import { cancelAutoRenew } from '@/app/actions/subscription';

export async function POST() {
  try {
    const result = await cancelAutoRenew();

    if (!result.success) {
      if (result.errors?.general === 'Unauthorized') {
        return NextResponse.json(result, { status: 401 });
      }

      if (result.errors?.general === 'No active renewable subscription found') {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Cancel subscription API error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: { general: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
