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
 * Map aspect ratio to Flux Pro compatible format
 * Flux Pro accepts aspect ratio as width and height
 */
function mapAspectRatioToFlux(ratio: string): { width: number; height: number } | undefined {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1280:720': { width: 1280, height: 720 },
    '720:1280': { width: 720, height: 1280 },
    '1024:1024': { width: 1024, height: 1024 },
    '1920:1080': { width: 1920, height: 1080 },
    '1080:1920': { width: 1080, height: 1920 },
  };

  return ratioMap[ratio];
}

export interface CreateReplicateImageJobRequest {
  imageUrl: string;
  prompt: string;
  aspectRatio?: string;
}

/**
 * Create a new image-to-image generation job using Flux Pro
 */
export async function createReplicateImageJob(
  request: CreateReplicateImageJobRequest
): Promise<{ id: string; status: string }> {
  const { imageUrl, prompt, aspectRatio } = request;

  const input: Record<string, unknown> = {
    image: imageUrl,
    prompt: prompt,
  };

  // Add aspect ratio if provided and mapped
  if (aspectRatio) {
    const fluxRatio = mapAspectRatioToFlux(aspectRatio);
    if (fluxRatio) {
      input.width = fluxRatio.width;
      input.height = fluxRatio.height;
    }
  }

  return createReplicatePrediction({
    version: ReplicateModels.FLUX_PRO,
    input,
  });
}

/**
 * Extract image URL from Replicate prediction output
 * Handles different output formats (string URL, array of URLs, or nested object)
 */
export function extractImageUrl(prediction: ReplicatePrediction): string | null {
  if (!prediction.output) {
    return null;
  }

  // If output is a string URL, return it
  if (typeof prediction.output === 'string') {
    return prediction.output;
  }

  // If output is an array, return the first URL
  if (Array.isArray(prediction.output)) {
    if (prediction.output.length > 0) {
      const firstOutput = prediction.output[0];
      if (typeof firstOutput === 'string') {
        return firstOutput;
      }
      // Handle array of objects with URL property
      if (typeof firstOutput === 'object' && firstOutput !== null && 'url' in firstOutput) {
        return (firstOutput as { url: string }).url;
      }
    }
    return null;
  }

  // If output is an object, try to extract URL from common properties
  if (typeof prediction.output === 'object' && prediction.output !== null) {
    const outputObj = prediction.output as Record<string, unknown>;
    if ('url' in outputObj && typeof outputObj.url === 'string') {
      return outputObj.url;
    }
    if ('imageUrl' in outputObj && typeof outputObj.imageUrl === 'string') {
      return outputObj.imageUrl;
    }
    if ('image_url' in outputObj && typeof outputObj.image_url === 'string') {
      return outputObj.image_url;
    }
  }

  return null;
}

/**
 * Common model helpers
 */
export const ReplicateModels = {
  // Stable Diffusion
  STABLE_DIFFUSION: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',

  // Video generation models (examples)
  STABLE_VIDEO_DIFFUSION: 'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8',

  // Flux Pro for image-to-image generation
  FLUX_PRO: 'black-forest-labs/flux-1.1-pro',

  // Add more models as needed
} as const;
