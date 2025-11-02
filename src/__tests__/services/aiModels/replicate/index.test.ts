import { describe, it, expect, vi } from 'vitest';
import * as ReplicateAPI from '../../../../services/aiModels/replicate';

// Mock the api-client module
vi.mock('../../../../services/aiModels/replicate/api-client', () => ({
  createReplicatePrediction: vi.fn(),
  getReplicatePredictionStatus: vi.fn(),
  pollReplicatePrediction: vi.fn(),
  createReplicateImageJob: vi.fn(),
  extractImageUrl: vi.fn(),
  ReplicateModels: {},
}));

describe('Replicate Service Index', () => {
  it('should re-export all functions from api-client', () => {
    expect(ReplicateAPI.createReplicatePrediction).toBeDefined();
    expect(ReplicateAPI.getReplicatePredictionStatus).toBeDefined();
    expect(ReplicateAPI.pollReplicatePrediction).toBeDefined();
    expect(ReplicateAPI.createReplicateImageJob).toBeDefined();
    expect(ReplicateAPI.extractImageUrl).toBeDefined();
    expect(ReplicateAPI.ReplicateModels).toBeDefined();
  });

  it('should export functions as expected types', () => {
    expect(typeof ReplicateAPI.createReplicatePrediction).toBe('function');
    expect(typeof ReplicateAPI.getReplicatePredictionStatus).toBe('function');
    expect(typeof ReplicateAPI.pollReplicatePrediction).toBe('function');
    expect(typeof ReplicateAPI.createReplicateImageJob).toBe('function');
    expect(typeof ReplicateAPI.extractImageUrl).toBe('function');
    expect(typeof ReplicateAPI.ReplicateModels).toBe('object');
  });
});
