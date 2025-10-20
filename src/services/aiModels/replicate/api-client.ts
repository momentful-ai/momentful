/**
 * Replicate API client for running AI models
 * Replicate hosts various AI models including Stable Diffusion, video generation, etc.
 */

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

export interface ReplicateWebhookEvent {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

/**
 * Create a new prediction (run a model)
 */
export async function createReplicatePrediction(
  request: CreatePredictionRequest
): Promise<{ id: string; status: string }> {
  const response = await fetch('/api/replicate/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create prediction');
  }

  return response.json();
}

/**
 * Get the status of a prediction
 */
export async function getReplicatePredictionStatus(
  predictionId: string
): Promise<ReplicatePrediction> {
  const response = await fetch(`/api/replicate/predictions/${predictionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get prediction status');
  }

  return response.json();
}

/**
 * Poll for prediction completion
 */
export async function pollReplicatePrediction(
  predictionId: string,
  onProgress?: (prediction: ReplicatePrediction) => void,
  maxAttempts: number = 120, // 4 minutes for long-running models
  intervalMs: number = 2000
): Promise<ReplicatePrediction> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const prediction = await getReplicatePredictionStatus(predictionId);
      onProgress?.(prediction);

      if (prediction.status === 'succeeded') {
        return prediction;
      }

      if (prediction.status === 'failed') {
        throw new Error(typeof prediction.error === 'string' ? prediction.error : 'Prediction failed');
      }

      if (prediction.status === 'canceled') {
        throw new Error('Prediction was canceled');
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      console.error('Error polling prediction status:', error);
      throw error;
    }
  }

  throw new Error('Prediction polling timed out');
}

/**
 * Common model helpers
 */
export const ReplicateModels = {
  // Stable Diffusion
  STABLE_DIFFUSION: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',

  // Video generation models (examples)
  STABLE_VIDEO_DIFFUSION: 'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8',

  // Add more models as needed
} as const;
