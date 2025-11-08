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

    // Check if this is an HTTP error from Replicate (e.g., 402 Payment Required)
    if (error instanceof Error && 'response' in error) {
      const httpError = error as Error & {
        response?: {
          status?: number;
          data?: { title?: string; detail?: string };
        };
      };
      if (httpError.response?.status === 402) {
        // Forward the payment error details from Replicate
        const title = httpError.response?.data?.title || 'Monthly spend limit reached';
        const detail = httpError.response?.data?.detail || 'Payment required. Please check your account billing settings.';
        return res.status(402).json({
          error: 'Payment Required',
          title,
          detail,
          status: 402
        });
      }
      if (httpError.response?.status) {
        // Forward other HTTP status codes
        const detail = httpError.response?.data?.detail || `HTTP ${httpError.response.status} error occurred. Please try again.`;
        const title = httpError.response?.data?.title;
        return res.status(httpError.response.status).json({
          error: `HTTP ${httpError.response.status}`,
          ...(title && { title }),
          detail,
          status: httpError.response.status
        });
      }
    }

    return res.status(500).json({
      error: 'Failed to create Replicate prediction',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
