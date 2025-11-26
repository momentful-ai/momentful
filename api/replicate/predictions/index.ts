import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createReplicatePrediction,
  validatePredictionInput,
  ReplicateModels,
} from '../../shared/replicate.js';
import { convertStoragePathsToSignedUrls } from '../../shared/external-signed-urls.js';
import { supabase } from '../../shared/supabase.js';

// Re-export for backward compatibility
export { createReplicatePrediction, ReplicateModels };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { version, input, userId, projectId, prompt } = req.body;

    if (!version || !input) {
      return res.status(400).json({
        error: 'Missing required fields: version and input'
      });
    }

    // Check generation limit if userId is provided
    if (userId) {
      try {
        const { data: limits, error: limitsError } = await supabase
          .from('user_generation_limits')
          .select('images_remaining')
          .eq('user_id', userId)
          .single();

        // If no record exists, create one with defaults
        let imagesRemaining = 10;
        if (limitsError || !limits) {
          const { data: newLimits } = await supabase
            .from('user_generation_limits')
            .insert({
              user_id: userId,
              images_remaining: 10,
              videos_remaining: 5,
              images_limit: 10,
              videos_limit: 5,
            })
            .select()
            .single();
          imagesRemaining = newLimits?.images_remaining ?? 10;
        } else {
          imagesRemaining = limits.images_remaining;
        }

        if (imagesRemaining <= 0) {
          return res.status(403).json({
            error: 'Image generation limit reached',
            message: `You've maxed out your image credits :(
Message the Momentful crew at hello@momentful.ai to unlock more.`,
          });
        }

        // Decrement the count before creating the prediction
        const { error: decrementError } = await supabase
          .from('user_generation_limits')
          .update({ images_remaining: imagesRemaining - 1 })
          .eq('user_id', userId);

        if (decrementError) {
          console.error('Failed to decrement image generation limit:', decrementError);
          // Continue with generation even if decrement fails, but log the error
        }
      } catch (limitCheckError) {
        console.error('Error during generation limit check:', limitCheckError);
        // Continue with generation even if limit check fails
      }
    }

    // Validate input based on model version
    const validation = validatePredictionInput(version, input);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid input format',
        details: validation.error
      });
    }

    // Convert any storage paths to signed URLs for external provider access
    const processedInput = await convertStoragePathsToSignedUrls(input);

    const prediction = await createReplicatePrediction({ version, input: processedInput });

    // Store metadata for later use when job completes
    // We'll create the DB record when the job completes (edited_images doesn't have status field)
    // Store prediction_id -> metadata mapping (we'll use a simple approach: pass it in status checks)
    
    return res.status(201).json({
      ...prediction,
      // Include metadata in response so client can pass it to status endpoint
      metadata: userId && projectId && prompt ? {
        userId,
        projectId,
        prompt,
      } : undefined,
    });
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
