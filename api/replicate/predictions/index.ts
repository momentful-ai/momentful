import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createReplicatePrediction,
  validatePredictionInput,
  ReplicateModels,
} from '../../shared/replicate.js';

// Re-export for backward compatibility
export { createReplicatePrediction, ReplicateModels };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { version, input } = req.body;

    if (!version || !input) {
      return res.status(400).json({
        error: 'Missing required fields: version and input'
      });
    }

    // Validate input based on model version
    const validation = validatePredictionInput(version, input);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid input format',
        details: validation.error
      });
    }

    const prediction = await createReplicatePrediction({ version, input });
    return res.status(201).json(prediction);
  } catch (error) {
    // Better error handling - log the actual error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create Replicate prediction:', errorMessage);
    
    return res.status(500).json({
      error: 'Failed to create Replicate prediction',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
