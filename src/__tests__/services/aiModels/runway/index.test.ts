import { describe, it, expect, vi } from 'vitest';
import * as RunwayAPI from '../../../../services/aiModels/runway';

// Mock the api-client module
vi.mock('../../../../services/aiModels/runway/api-client', () => ({
  createRunwayJob: vi.fn(),
  createRunwayImageJob: vi.fn(),
  getRunwayJobStatus: vi.fn(),
  pollJobStatus: vi.fn(),
  extractImageUrl: vi.fn(),
  updateProjectVideoStatuses: vi.fn(),
}));

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
