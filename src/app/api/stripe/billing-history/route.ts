import { NextResponse } from 'next/server';
import { getBillingHistory } from '@/app/actions/subscription';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get('limit') || '10');
    const limit = Number.isFinite(limitParam) ? limitParam : 10;

    const result = await getBillingHistory(limit);

    if (!result.success) {
      const status = result.errors?.general === 'Unauthorized' ? 401 : 500;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Billing history API error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: { general: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
