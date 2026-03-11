import { POST } from '@/app/api/admin/login/route';
import { validateAdminLogin } from '@/app/admin/login/auth-utils';

jest.mock('@/app/admin/login/auth-utils', () => ({
  validateAdminLogin: jest.fn(),
}));

describe('POST /api/admin/login', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 400 when email is missing', async () => {
    const request = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'Password123!' }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password required');
    expect(validateAdminLogin).not.toHaveBeenCalled();
  });

  it('returns 401 when admin validation fails', async () => {
    (validateAdminLogin as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    const request = new Request('http://localhost:3000/api/admin/login', {
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
    expect(data.error).toBe('Invalid email or password');
    expect(validateAdminLogin).toHaveBeenCalledWith('admin@example.com', 'Password123!');
  });

  it('returns 200 when admin validation succeeds', async () => {
    (validateAdminLogin as jest.Mock).mockResolvedValue({ success: true });

    const request = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Password123!',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, redirectUrl: '/admin' });
  });

  it('returns 500 when validation throws', async () => {
    (validateAdminLogin as jest.Mock).mockRejectedValue(new Error('DB failure'));

    const request = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Password123!',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
