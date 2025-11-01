import { describe, it, expect } from 'vitest';
import { ReplicateModels, RunwayModels, isFluxModel } from '../shared/models';

describe('Shared Models', () => {
  describe('ReplicateModels', () => {
    it('exports STABLE_DIFFUSION model identifier', () => {
      expect(ReplicateModels.STABLE_DIFFUSION).toBe(
        'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf'
      );
    });

    it('exports STABLE_VIDEO_DIFFUSION model identifier', () => {
      expect(ReplicateModels.STABLE_VIDEO_DIFFUSION).toBe(
        'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8'
      );
    });

    it('exports FLUX_PRO model identifier', () => {
      expect(ReplicateModels.FLUX_PRO).toBe('black-forest-labs/flux-kontext-pro');
    });

    it('has all expected Replicate model constants', () => {
      expect(ReplicateModels).toHaveProperty('STABLE_DIFFUSION');
      expect(ReplicateModels).toHaveProperty('STABLE_VIDEO_DIFFUSION');
      expect(ReplicateModels).toHaveProperty('FLUX_PRO');
    });
  });

  describe('RunwayModels', () => {
    it('exports VEO_3_1_FAST model identifier', () => {
      expect(RunwayModels.VEO_3_1_FAST).toBe('veo3.1_fast');
    });

    it('exports GEN_4_IMAGE model identifier', () => {
      expect(RunwayModels.GEN_4_IMAGE).toBe('gen4_image');
    });

    it('exports GEN_4_IMAGE_TURBO model identifier', () => {
      expect(RunwayModels.GEN_4_IMAGE_TURBO).toBe('gen4_image_turbo');
    });

    it('exports GEMINI_2_5_FLASH model identifier', () => {
      expect(RunwayModels.GEMINI_2_5_FLASH).toBe('gemini_2.5_flash');
    });

    it('has all expected Runway model constants', () => {
      expect(RunwayModels).toHaveProperty('VEO_3_1_FAST');
      expect(RunwayModels).toHaveProperty('GEN_4_IMAGE');
      expect(RunwayModels).toHaveProperty('GEN_4_IMAGE_TURBO');
      expect(RunwayModels).toHaveProperty('GEMINI_2_5_FLASH');
    });
  });

  describe('isFluxModel', () => {
    it('returns true for exact FLUX_PRO match', () => {
      expect(isFluxModel(ReplicateModels.FLUX_PRO)).toBe(true);
    });

    it('returns true for model string containing flux-kontext-pro', () => {
      expect(isFluxModel('black-forest-labs/flux-kontext-pro')).toBe(true);
      expect(isFluxModel('some-prefix/flux-kontext-pro/suffix')).toBe(true);
      expect(isFluxModel('flux-kontext-pro-v2')).toBe(true);
    });

    it('returns false for non-Flux models', () => {
      expect(isFluxModel(ReplicateModels.STABLE_DIFFUSION)).toBe(false);
      expect(isFluxModel(ReplicateModels.STABLE_VIDEO_DIFFUSION)).toBe(false);
      expect(isFluxModel('stable-diffusion')).toBe(false);
      expect(isFluxModel('')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isFluxModel('FLUX-KONTEXT-PRO')).toBe(false);
      expect(isFluxModel('Flux-Kontext-Pro')).toBe(false);
    });
  });
});

