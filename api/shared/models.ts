/**
 * Centralized model name constants for all AI providers
 * All model identifiers should be defined here to avoid duplication
 */

export const ReplicateModels = {
  // Stable Diffusion
  STABLE_DIFFUSION: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',

  // Video generation models
  STABLE_VIDEO_DIFFUSION: 'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8',

  // Flux Pro for image-to-image generation
  FLUX_PRO: 'black-forest-labs/flux-kontext-pro',
} as const;

export const RunwayModels = {
  // Video generation models
  VEO_3_1_FAST: 'veo3.1_fast',
  GEN4_TURBO: 'gen4_turbo',
  GEN4_ALEPH: 'gen4_aleph',
  UPSCALE_V1: 'upscale_v1',
  ACT_TWO: 'act_two',

  // Image generation models
  GEN_4_IMAGE: 'gen4_image',
  GEN_4_IMAGE_TURBO: 'gen4_image_turbo',
  GEMINI_2_5_FLASH: 'gemini_2.5_flash',
} as const;

// Helper function to check if a model is a Flux model
export function isFluxModel(model: string): boolean {
  return model === ReplicateModels.FLUX_PRO || model.includes('flux-kontext-pro');
}

