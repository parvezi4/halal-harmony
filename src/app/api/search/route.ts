import { NextResponse } from 'next/server';
import { searchProfiles } from '@/app/actions/search';

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseText(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const submitted = url.searchParams.get('submitted') === 'true';
    if (!submitted) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          pagination: {
            total: 0,
            page: 1,
            pageSize: 20,
            totalPages: 1,
          },
          targetGender: null,
          freeTier: null,
        },
      });
    }

    const minAge = parseNumber(url.searchParams.get('minAge'));
    const maxAge = parseNumber(url.searchParams.get('maxAge'));

    if (
      typeof minAge === 'number' &&
      typeof maxAge === 'number' &&
      minAge > maxAge
    ) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            minAge: 'Minimum age cannot be greater than maximum age',
          },
        },
        { status: 400 }
      );
    }

    const result = await searchProfiles({
      filters: {
        minAge,
        maxAge,
        country: parseText(url.searchParams.get('country')),
        cityOrRegion: parseText(url.searchParams.get('cityOrRegion')),
        maritalStatus: parseText(url.searchParams.get('maritalStatus')),
        practicingLevel: parseText(url.searchParams.get('practicingLevel')),
        hijabOrBeard: parseText(url.searchParams.get('hijabOrBeard')),
        smoking: parseText(url.searchParams.get('smoking')) as 'yes' | 'no' | undefined,
        education: parseText(url.searchParams.get('education')),
        profession: parseText(url.searchParams.get('profession')),
        willingToRelocate: parseText(url.searchParams.get('willingToRelocate')) as
          | 'yes'
          | 'maybe'
          | 'no'
          | undefined,
      },
      page: parseNumber(url.searchParams.get('page')),
      pageSize: parseNumber(url.searchParams.get('pageSize')),
      sort: 'newest',
    });

    if (!result.success) {
      const status = result.errors?.general === 'Unauthorized' ? 401 : 403;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      {
        success: false,
        errors: {
          general: 'Unable to fetch search results',
        },
      },
      { status: 500 }
    );
  }
}
