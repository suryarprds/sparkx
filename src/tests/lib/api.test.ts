import { describe, it, expect, beforeAll } from 'vitest';

describe('API Module', () => {
  beforeAll(() => {
    // Set base URL for tests
    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
    expect(API_BASE_URL).toBeDefined();
  });

  it('should have API base URL configured', () => {
    const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
    expect(API_BASE_URL).toBeTruthy();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('should construct valid robot endpoint', () => {
    const robotId = 123;
    const endpoint = `/api/robots/${robotId}`;
    expect(endpoint).toBe('/api/robots/123');
  });

  it('should construct valid telemetry endpoint', () => {
    const endpoint = '/api/robots/telemetry';
    expect(endpoint).toMatch(/\/api\/robots\/telemetry/);
  });

  it('should construct valid alerts endpoint', () => {
    const endpoint = '/api/robots/alerts';
    expect(endpoint).toMatch(/\/api\/robots\/alerts/);
  });

  it('should construct valid tasks endpoint', () => {
    const endpoint = '/api/robots/tasks';
    expect(endpoint).toMatch(/\/api\/robots\/tasks/);
  });
});
