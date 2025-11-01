/**
 * Shared Runway API types, client, and functions
 * Consolidated from duplicate code across API endpoints
 */

import RunwayML from '@runwayml/sdk';
import { config } from 'dotenv';
import { RunwayModels } from './models.js';

const apiKey = process.env.RUNWAY_API_KEY || config().parsed?.RUNWAY_API_KEY;

if (!apiKey) {
  console.warn('⚠️  RUNWAY_API_KEY not set. Runway features will not work in development.');
}

export const runway = new RunwayML({ apiKey: apiKey || 'dummy-key' });

export type Mode = 'image-to-video' | 'text-to-video' | 'image-generation';

// Supported image models
export const supportedImageModels = new Set<RunwayML.TextToImageCreateParams['model']>([
  RunwayModels.GEN_4_IMAGE,
  RunwayModels.GEN_4_IMAGE_TURBO,
  RunwayModels.GEMINI_2_5_FLASH,
]);

// Supported image ratios (from validation.ts)
export const supportedImageRatios = new Set<RunwayML.TextToImageCreateParams['ratio']>([
  '1920:1080',
  '1080:1920',
  '1024:1024',
  '1360:768',
  '1080:1080',
  '1168:880',
  '1440:1080',
  '1080:1440',
  '1808:768',
  '2112:912',
  '1280:720',
  '720:1280',
  '720:720',
  '960:720',
  '720:960',
  '1680:720',
  '1344:768',
  '768:1344',
  '1184:864',
  '864:1184',
  '1536:672',
  '832x1248',
  '1248x832',
  '896x1152',
  '1152x896',
]);

export const defaultImageRatio: RunwayML.TextToImageCreateParams['ratio'] = '1280:720';
export const defaultVideoModel = RunwayModels.VEO_3_1_FAST;
export const defaultVideoRatio: RunwayML.ImageToVideoCreateParams['ratio'] = '1280:720';
export const defaultVideoDuration = 4;

/**
 * Create a video generation task
 */
export async function createVideoTask(input: {
  mode: Mode;
  promptText?: string;
  promptImage?: string;
  model?: string;
}) {
  // Check if API key is available
  if (!apiKey) {
    throw new Error('apiKey not configured. Please set your Runway API key.');
  }

  if (input.mode === 'image-to-video') {
    if (!input.promptImage) throw new Error('promptImage required');
    return await runway.imageToVideo.create({
      model: defaultVideoModel,
      promptImage: input.promptImage,
      promptText: input.promptText,
      ratio: defaultVideoRatio,
      duration: defaultVideoDuration,
    });
  }

  if (input.mode === 'text-to-video') {
    if (!input.promptText) throw new Error('promptText required');
    return await runway.textToVideo.create({
      model: defaultVideoModel,
      promptText: input.promptText,
      ratio: defaultVideoRatio,
      duration: defaultVideoDuration,
    });
  }

  throw new Error(`Unsupported mode: ${input.mode}`);
}

/**
 * Create an image generation task
 */
export async function createImageTask(input: {
  promptImage: string;
  promptText: string;
  model?: string;
  ratio?: RunwayML.TextToImageCreateParams['ratio'];
}) {
  // Check if API key is available
  if (!apiKey) {
    throw new Error('apiKey not configured. Please set your Runway API key.');
  }

  if (!input.promptImage) throw new Error('promptImage required');
  if (!input.promptText) throw new Error('promptText required');

  const modelName: RunwayML.TextToImageCreateParams['model'] = supportedImageModels.has(
    input.model as RunwayML.TextToImageCreateParams['model'],
  )
    ? (input.model as RunwayML.TextToImageCreateParams['model'])
    : RunwayModels.GEN_4_IMAGE;

  const ratioCandidate = input.ratio ?? defaultImageRatio;
  const ratio: RunwayML.TextToImageCreateParams['ratio'] = supportedImageRatios.has(
    ratioCandidate,
  )
    ? ratioCandidate
    : defaultImageRatio;

  return await runway.textToImage.create({
    model: modelName,
    promptText: input.promptText,
    ratio,
    referenceImages: [
      {
        uri: input.promptImage,
        tag: 'source',
      },
    ],
  });
}

/**
 * Get Runway task status
 */
export async function getRunwayTask(taskId: string) {
  // Check if API key is available
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY not configured. Please set your Runway API key.');
  }

  return await runway.tasks.retrieve(taskId);
}

// Re-export models for convenience
export { RunwayModels };

