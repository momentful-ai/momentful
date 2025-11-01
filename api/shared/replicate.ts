/**
 * Shared Replicate API types, client, and functions
 * Consolidated from duplicate code across API endpoints
 */

import Replicate from 'replicate';
import { z } from 'zod';
import { ReplicateModels, isFluxModel } from './models.js';

// Initialize Replicate client
export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Types
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
 * Validation schema for flux-kontext-pro model inputs
 * Based on the official flux-kontext-pro schema
 */
export const fluxKontextProInputSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  input_image: z.union([z.string().url(), z.null()]).optional(),
  aspect_ratio: z.enum([
    'match_input_image',
    '1:1',
    '16:9',
    '9:16',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '4:5',
    '5:4',
    '21:9',
    '9:21',
    '2:1',
    '1:2'
  ]).optional(),
  seed: z.union([z.number().int(), z.null()]).optional(),
  output_format: z.enum(['jpg', 'png']).optional(),
  safety_tolerance: z.number().int().min(0).max(6).optional(),
  prompt_upsampling: z.boolean().optional(),
});

/**
 * Validate input for flux-kontext-pro model
 */
export function validateFluxKontextProInput(input: unknown): { valid: boolean; error?: string } {
  try {
    fluxKontextProInputSchema.parse(input);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { valid: false, error: 'Invalid input format' };
  }
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
 * Validate prediction input based on model version
 */
export function validatePredictionInput(version: string, input: unknown): { valid: boolean; error?: string } {
  if (isFluxModel(version)) {
    return validateFluxKontextProInput(input);
  }
  // For other models, basic validation could be added here
  return { valid: true };
}

// Re-export models for convenience
export { ReplicateModels };

