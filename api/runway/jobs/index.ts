import type { VercelRequest, VercelResponse } from '@vercel/node';
import RunwayML from '@runwayml/sdk';
import { config } from 'dotenv';
import { createJobSchema } from '../../validation.js';

/**
 * Extract meaningful error message from Runway API error responses
 * Handles various error formats and extracts the actual error message
 */
function extractErrorMessage(errorMessage: string): string {
  // If it's already a clean error message, return it
  if (!errorMessage.includes('HTTP') && !errorMessage.includes('{') && !errorMessage.includes('"')) {
    return errorMessage;
  }

  // Try to extract from HTTP error format: "HTTP 400: Bad Request - {"error":"message"}"
  if (errorMessage.includes('HTTP')) {
    const httpMatch = errorMessage.match(/HTTP \d+: ([^{]*)/);
    if (httpMatch && httpMatch[1]) {
      return httpMatch[1].trim();
    }
  }

  // Try to extract from JSON error format
  try {
    // Look for JSON-like content in the error message
    const jsonMatch = errorMessage.match(/\{.*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error) {
        return parsed.error;
      }
      if (parsed.message) {
        return parsed.message;
      }
    }
  } catch {
    // If JSON parsing fails, continue with other methods
  }

  // If we can't extract a meaningful message, return a cleaned version
  return errorMessage.replace(/HTTP \d+: /, '').trim() || 'Failed to create Runway task';
}

const apiKey = process.env.RUNWAY_API_KEY || config().parsed?.RUNWAY_API_KEY;

if (!apiKey) {
  console.warn('⚠️  RUNWAY_API_KEY not set. Runway features will not work in development.');
}

export const runway = new RunwayML({ apiKey: apiKey || 'dummy-key' });

export type Mode = 'image-to-video' | 'text-to-video' | 'image-generation';

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
      model: 'veo3.1_fast',
      promptImage: input.promptImage,
      promptText: input.promptText,
      ratio: '1280:720',
      duration: 4,
    });
  }

  if (input.mode === 'text-to-video') {
    if (!input.promptText) throw new Error('promptText required');
    return await runway.textToVideo.create({
      model: 'veo3.1_fast',
      promptText: input.promptText,
      ratio: '1280:720',
      duration: 4,
    });
  }

  throw new Error(`Unsupported mode: ${input.mode}`);
}

const supportedImageModels = new Set<RunwayML.TextToImageCreateParams['model']>([
  'gen4_image',
  'gen4_image_turbo',
  'gemini_2.5_flash',
]);

const supportedImageRatios = new Set<RunwayML.TextToImageCreateParams['ratio']>([
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

const defaultImageRatio: RunwayML.TextToImageCreateParams['ratio'] = '1280:720';

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
    : 'gen4_image';

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

export async function getRunwayTask(taskId: string) {
  // Check if API key is available
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY not configured. Please set your Runway API key.');
  }

  return await runway.tasks.retrieve(taskId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('req.body', req.body);
  if (req.method !== 'POST') return res.status(405).end();
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    let task;
    
    if (parsed.data.mode === 'image-generation') {
      if (!parsed.data.promptImage) {
        return res.status(400).json({ error: 'promptImage required for image-generation mode' });
      }
      if (!parsed.data.promptText) {
        return res.status(400).json({ error: 'promptText required for image-generation mode' });
      }
      if (!parsed.data.ratio) {
        return res.status(400).json({ error: 'ratio required for image-generation mode' });
      }
      task = await createImageTask({
        promptImage: parsed.data.promptImage,
        promptText: parsed.data.promptText,
        model: parsed.data.model,
        ratio: parsed.data.ratio,
      });
    } else {
      task = await createVideoTask(parsed.data);
    }
    
    return res.status(200).json({ taskId: task.id, status: 'processing' });
  } catch (error) {
    console.error('Error creating Runway task:', error);

    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Failed to create Runway task';

    if (error instanceof Error) {
      // Try to extract meaningful error message from the error response
      errorMessage = extractErrorMessage(error.message);

      // Determine status code based on error content
      if (error.message.includes('HTTP 4')) {
        statusCode = 400;
      } else if (error.message.includes('HTTP 5')) {
        statusCode = 500;
      }
    }

    return res.status(statusCode).json({ error: errorMessage });
  }
}
