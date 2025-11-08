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

export interface ReplicateAPIError extends Error {
  name: 'ReplicateAPIError' | 'ReplicatePaymentError';
  status?: number;
  title?: string;
  detail?: string;
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
    let error;
    try {
      error = await response.json();
    } catch (_jsonError) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // If JSON parsing fails, create a fallback error object
      error = {
        error: `HTTP ${response.status}`,
        detail: `Server returned status ${response.status}. ${response.statusText || 'Please try again.'}`,
      };
    }

    // Handle specific error types like payment required
    if (response.status === 402) {
      const paymentError: ReplicateAPIError = new Error(error.detail || error.title || 'Payment Required') as ReplicateAPIError;
      paymentError.name = 'ReplicatePaymentError';
      paymentError.status = 402;
      paymentError.title = error.title;
      paymentError.detail = error.detail;
      throw paymentError;
    }

    // Handle other HTTP errors
    if (error.detail || error.title) {
      const apiError: ReplicateAPIError = new Error(error.detail || error.title || error.error || 'API Error') as ReplicateAPIError;
      apiError.name = 'ReplicateAPIError';
      apiError.status = response.status;
      apiError.title = error.title;
      apiError.detail = error.detail;
      throw apiError;
    }

    // Fallback to generic error
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
    let error;
    try {
      error = await response.json();
    } catch (_jsonError) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // If JSON parsing fails, create a fallback error object
      error = {
        error: `HTTP ${response.status}`,
        detail: `Server returned status ${response.status}. ${response.statusText || 'Please try again.'}`,
      };
    }
    throw new Error(error.error || error.detail || 'Failed to get prediction status');
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
 * Map aspect ratio ID to flux-kontext-pro compatible format
 * flux-kontext-pro accepts aspect ratio as string enum: "match_input_image", "1:1", "16:9", "9:16", etc.
 */
function mapAspectRatioToFluxKontextPro(ratioId: string): string | undefined {
  // Map from app's aspect ratio IDs to flux-kontext-pro enum values
  const ratioMap: Record<string, string> = {
    '1280:720': '16:9',
    '1920:1080': '16:9',
    '720:1280': '9:16',
    '1080:1920': '9:16',
    '1024:1024': '1:1',
  };

  return ratioMap[ratioId];
}

export interface CreateReplicateImageJobRequest {
  imageUrl: string;
  prompt: string;
  aspectRatio?: string;
  seed?: number;
  outputFormat?: 'jpg' | 'png';
  safetyTolerance?: number; // 0-6, default 2
  promptUpsampling?: boolean;
}

/**
 * Create a new image-to-image generation job using flux-kontext-pro
 * 
 * According to flux-kontext-pro schema:
 * - prompt (required): string
 * - input_image (optional): string URI format
 * - aspect_ratio (optional): enum string, default "match_input_image"
 * - seed (optional): integer
 * - output_format (optional): "jpg" | "png", default "png"
 * - safety_tolerance (optional): integer 0-6, default 2
 * - prompt_upsampling (optional): boolean, default false
 */
export async function createReplicateImageJob(
  request: CreateReplicateImageJobRequest
): Promise<{ id: string; status: string }> {
  const { 
    imageUrl, 
    prompt, 
    aspectRatio, 
    seed, 
    outputFormat, 
    safetyTolerance, 
    promptUpsampling 
  } = request;

  const input: Record<string, unknown> = {
    prompt: prompt,
    input_image: imageUrl, // flux-kontext-pro uses input_image, not image
  };

  // Map aspect ratio if provided
  if (aspectRatio) {
    const fluxAspectRatio = mapAspectRatioToFluxKontextPro(aspectRatio);
    if (fluxAspectRatio) {
      input.aspect_ratio = fluxAspectRatio;
    } else {
      // Default to match_input_image if mapping fails
      input.aspect_ratio = 'match_input_image';
    }
  } else {
    // Default to match_input_image if not provided
    input.aspect_ratio = 'match_input_image';
  }

  // Add optional fields if provided
  if (seed !== undefined) {
    input.seed = seed;
  }

  if (outputFormat) {
    input.output_format = outputFormat;
  }

  if (safetyTolerance !== undefined) {
    input.safety_tolerance = safetyTolerance;
  }

  if (promptUpsampling !== undefined) {
    input.prompt_upsampling = promptUpsampling;
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
  FLUX_PRO: 'black-forest-labs/flux-kontext-pro',

  // Add more models as needed
} as const;
