// Jest test setup file

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
global.afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 500));
});