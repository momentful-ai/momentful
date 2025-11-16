import { describe, it, expect, vi } from 'vitest';

// Mock fetch globally to prevent actual HTTP calls that might hang
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock any database calls that might hang
vi.mock('../../../../lib/database', () => ({
  database: {
    generatedVideos: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import the actual module after mocking dependencies
import * as RunwayAPI from '../../../../services/aiModels/runway';

describe('Runway Service Index', () => {
  it('should re-export all functions from api-client', () => {
    expect(RunwayAPI.createRunwayJob).toBeDefined();
    expect(RunwayAPI.createRunwayImageJob).toBeDefined();
    expect(RunwayAPI.getRunwayJobStatus).toBeDefined();
    expect(RunwayAPI.pollJobStatus).toBeDefined();
    expect(RunwayAPI.extractImageUrl).toBeDefined();
    expect(RunwayAPI.updateProjectVideoStatuses).toBeDefined();
  });

  it('should export functions as expected types', () => {
    expect(typeof RunwayAPI.createRunwayJob).toBe('function');
    expect(typeof RunwayAPI.createRunwayImageJob).toBe('function');
    expect(typeof RunwayAPI.getRunwayJobStatus).toBe('function');
    expect(typeof RunwayAPI.pollJobStatus).toBe('function');
    expect(typeof RunwayAPI.extractImageUrl).toBe('function');
    expect(typeof RunwayAPI.updateProjectVideoStatuses).toBe('function');
  });
});
