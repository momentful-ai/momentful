import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});


export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'aborted';
  output?: string | string[];
  error?: unknown;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreatePredictionRequest {
  version: string; // Model version identifier
  input: Record<string, unknown>; // Model-specific inputs
}

/**
 * Create a new prediction (run a model)
 */
export async function createReplicatePrediction(
  request: CreatePredictionRequest
): Promise<{ id: string }> {
  const prediction = await replicate.predictions.create(request);
  return { id: prediction.id! };
}

/**
 * Get prediction status
 */
export async function getReplicatePredictionStatus(
  predictionId: string
): Promise<ReplicatePrediction> {
  return await replicate.predictions.get(predictionId);
}

/**
 * Common model helpers
 */
export const ReplicateModels = {
  // Stable Diffusion
  STABLE_DIFFUSION: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',

  // Video generation models
  STABLE_VIDEO_DIFFUSION: 'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8',

  // Flux Pro for image-to-image generation
  FLUX_PRO: 'black-forest-labs/flux-1.1-pro',

  // Add more models as needed
} as const;


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { version, input } = req.body;

    if (!version || !input) {
      return res.status(400).json({
        error: 'Missing required fields: version and input'
      });
    }

    const prediction = await createReplicatePrediction({ version, input });
    return res.status(201).json(prediction);
  } catch {
    return res.status(500).json({
      error: 'Failed to create Replicate prediction'
    });
  }
}
