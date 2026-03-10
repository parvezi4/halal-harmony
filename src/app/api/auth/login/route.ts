import { NextRequest, NextResponse } from 'next/server';
import { validateUserLogin } from '@/app/auth/login/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const result = await validateUserLogin(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Login failed' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, redirectUrl: '/dashboard' },
      { status: 200 }
    );
  } catch (error) {
    console.error('User login API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
