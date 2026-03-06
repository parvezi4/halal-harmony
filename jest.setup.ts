// jest.setup.ts
// Setup file for Jest tests

// Set default environment variables for tests
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
