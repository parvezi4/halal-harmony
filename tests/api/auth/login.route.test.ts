import { POST } from '@/app/api/auth/login/route';
import { validateUserLogin } from '@/app/auth/login/auth-utils';

jest.mock('@/app/auth/login/auth-utils', () => ({
  validateUserLogin: jest.fn(),
}));

describe('POST /api/auth/login', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 400 when password is missing', async () => {
    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'member@example.com' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password required');
    expect(validateUserLogin).not.toHaveBeenCalled();
  });

  it('returns 401 when user validation fails', async () => {
    (validateUserLogin as jest.Mock).mockResolvedValue({
      success: false,
      error: 'This account is an admin account. Please use the admin login at /admin/login.',
    });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Password123!',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe(
      'This account is an admin account. Please use the admin login at /admin/login.'
    );
  });

  it('returns 200 when user validation succeeds', async () => {
    (validateUserLogin as jest.Mock).mockResolvedValue({ success: true });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@example.com',
        password: 'Password123!',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, redirectUrl: '/dashboard' });
  });

  it('returns 500 when validation throws', async () => {
    (validateUserLogin as jest.Mock).mockRejectedValue(new Error('DB failure'));

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@example.com',
        password: 'Password123!',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
