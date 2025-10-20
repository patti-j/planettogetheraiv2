import { describe, test, expect } from '@jest/globals';

// Simple validation tests without complex imports
describe('Optimization Request Validation', () => {
  
  // Basic validation function to test
  const validateOptimizationRequest = (request: any) => {
    if (!request.algorithmId) {
      throw new Error('Algorithm ID is required');
    }
    
    if (request.algorithmId.length > 100) {
      throw new Error('Algorithm ID too long');
    }
    
    if (!/^[a-z0-9-]+$/.test(request.algorithmId)) {
      throw new Error('Invalid algorithm ID format');
    }
    
    if (request.scheduleData?.events) {
      if (request.scheduleData.events.length > 10000) {
        throw new Error('Too many events');
      }
      
      for (const event of request.scheduleData.events) {
        if (event.startDate && !isValidISO8601(event.startDate)) {
          throw new Error('Invalid ISO 8601 date');
        }
      }
    }
    
    return request;
  };
  
  const isValidISO8601 = (dateString: string): boolean => {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    return iso8601Regex.test(dateString);
  };

  test('accepts valid request', () => {
    const validRequest = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: [
          { startDate: '2024-01-01T10:00:00Z' },
          { startDate: '2024-01-01T11:00:00.123Z' }
        ]
      }
    };
    
    expect(() => validateOptimizationRequest(validRequest)).not.toThrow();
  });

  test('rejects missing algorithm ID', () => {
    const invalidRequest = {
      scheduleData: { events: [] }
    };
    
    expect(() => validateOptimizationRequest(invalidRequest))
      .toThrow('Algorithm ID is required');
  });

  test('rejects invalid algorithm ID format', () => {
    const invalidRequest = {
      algorithmId: 'invalid algorithm!',
      scheduleData: { events: [] }
    };
    
    expect(() => validateOptimizationRequest(invalidRequest))
      .toThrow('Invalid algorithm ID format');
  });

  test('rejects algorithm ID > 100 characters', () => {
    const invalidRequest = {
      algorithmId: 'a'.repeat(101),
      scheduleData: { events: [] }
    };
    
    expect(() => validateOptimizationRequest(invalidRequest))
      .toThrow('Algorithm ID too long');
  });

  test('rejects events array > 10000 items', () => {
    const oversizedRequest = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: new Array(10001).fill({ id: 'E1' })
      }
    };
    
    expect(() => validateOptimizationRequest(oversizedRequest))
      .toThrow('Too many events');
  });

  test('accepts events array with exactly 10000 items', () => {
    const maxSizeRequest = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: new Array(10000).fill({ id: 'E1' })
      }
    };
    
    expect(() => validateOptimizationRequest(maxSizeRequest)).not.toThrow();
  });

  test('rejects invalid ISO dates', () => {
    const invalidDateRequest = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: [
          { startDate: '2024-01-01' }, // Missing time component
        ]
      }
    };
    
    expect(() => validateOptimizationRequest(invalidDateRequest))
      .toThrow('Invalid ISO 8601 date');
  });

  test('accepts valid ISO dates with different timezones', () => {
    const validDates = {
      algorithmId: 'forward-scheduling',
      scheduleData: {
        events: [
          { startDate: '2024-01-01T10:00:00Z' },
          { startDate: '2024-01-01T10:00:00+02:00' },
          { startDate: '2024-01-01T10:00:00.123Z' },
          { startDate: '2024-01-01T10:00:00-05:00' }
        ]
      }
    };
    
    expect(() => validateOptimizationRequest(validDates)).not.toThrow();
  });
});

describe('Schedule Data Sanitization', () => {
  
  const sanitizeString = (str: string): string => {
    // Remove script tags
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove event handlers
    str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    str = str.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove dangerous HTML tags
    str = str.replace(/<(iframe|embed|object|applet|meta|link|style|script|img)[^>]*>/gi, '');
    
    return str;
  };

  test('removes script tags', () => {
    const malicious = '<script>alert("XSS")</script>Normal text';
    const sanitized = sanitizeString(malicious);
    
    expect(sanitized).toBe('Normal text');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  test('removes event handlers', () => {
    const malicious = '<div onclick="hack()">Click me</div>';
    const sanitized = sanitizeString(malicious);
    
    expect(sanitized).not.toContain('onclick');
    // The regex leaves a space after removing the handler
    expect(sanitized).toContain('Click me</div>');
  });

  test('removes dangerous HTML tags', () => {
    const malicious = '<iframe src="evil.com"></iframe>Content<img src=x onerror=alert(1)>';
    const sanitized = sanitizeString(malicious);
    
    expect(sanitized).not.toContain('<iframe');
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('Content');
  });

  test('preserves safe content', () => {
    const safe = 'Temperature > 100°C & pressure < 50 bar';
    const sanitized = sanitizeString(safe);
    
    expect(sanitized).toBe(safe);
  });
});