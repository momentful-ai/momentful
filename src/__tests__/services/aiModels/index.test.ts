import { describe, it, expect, vi } from 'vitest';
import * as AIModels from '../../../services/aiModels';

// Mock the runway and replicate modules
vi.mock('../../../services/aiModels/runway', () => ({
  createRunwayJob: vi.fn(),
  createRunwayImageJob: vi.fn(),
  getRunwayJobStatus: vi.fn(),
  pollJobStatus: vi.fn(),
}));

vi.mock('../../../services/aiModels/replicate', () => ({
  createReplicatePrediction: vi.fn(),
  getReplicatePredictionStatus: vi.fn(),
  pollReplicatePrediction: vi.fn(),
}));

describe('AI Models Service Index', () => {
  it('should export Runway module', () => {
    expect(AIModels.Runway).toBeDefined();
    expect(typeof AIModels.Runway).toBe('object');
  });

  it('should export Replicate module', () => {
    expect(AIModels.Replicate).toBeDefined();
    expect(typeof AIModels.Replicate).toBe('object');
  });

  it('should have expected Runway exports', () => {
    expect(AIModels.Runway.createRunwayJob).toBeDefined();
    expect(AIModels.Runway.getRunwayJobStatus).toBeDefined();
    expect(AIModels.Runway.pollJobStatus).toBeDefined();
  });

  it('should have expected Replicate exports', () => {
    expect(AIModels.Replicate.createReplicatePrediction).toBeDefined();
    expect(AIModels.Replicate.getReplicatePredictionStatus).toBeDefined();
    expect(AIModels.Replicate.pollReplicatePrediction).toBeDefined();
  });
});
