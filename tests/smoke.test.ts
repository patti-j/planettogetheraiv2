// Smoke test to verify Jest setup
describe('Jest Setup', () => {
  test('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  test('environment variables are set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-secret-key-for-testing');
  });

  test('async tests work', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});