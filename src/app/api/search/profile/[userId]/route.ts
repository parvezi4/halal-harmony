import { NextResponse } from 'next/server';
import { getSearchProfileDetail } from '@/app/actions/search';

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const params = await context.params;
  const userId = params.userId;
  const result = await getSearchProfileDetail(userId);

  if (!result.success) {
    const status = result.errors?.general === 'Unauthorized' ? 401 : 404;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
