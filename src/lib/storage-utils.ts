/**
 * Client-side storage utilities for error handling and validation
 */

/**
 * Handle storage errors gracefully on the client side
 */
export function handleStorageError(error: unknown, operation: string): { success: false; error: string; retryable: boolean } {
  // Safely extract error properties
  const errorObj = error as Record<string, unknown> | undefined;
  const errorMessage = (typeof errorObj?.message === 'string') ? errorObj.message : 'Unknown storage error';
  const statusCode = (typeof errorObj?.statusCode === 'number') ? errorObj.statusCode :
                     (typeof errorObj?.status === 'number') ? errorObj.status : undefined;

  console.error(`Storage ${operation} error:`, {
    message: errorMessage,
    statusCode,
    operation
  });

  // Determine if error is retryable
  let retryable = false;
  let userMessage = 'Upload failed';

  switch (statusCode) {
    case 404:
      if (errorMessage.includes('Bucket not found')) {
        userMessage = 'Storage is not configured properly. Please contact support.';
      } else {
        userMessage = 'File not found';
      }
      break;

    case 403:
      userMessage = 'You do not have permission to upload files';
      break;

    case 413:
      userMessage = 'File is too large. Please choose a smaller file.';
      retryable = false;
      break;

    case 429:
      userMessage = 'Too many uploads. Please wait a moment and try again.';
      retryable = true;
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      userMessage = 'Server error. Please try again later.';
      retryable = true;
      break;

    default:
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        userMessage = 'Network error. Please check your connection and try again.';
        retryable = true;
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        userMessage = 'Storage limit reached. Please contact support.';
      }
      break;
  }

  return {
    success: false,
    error: userMessage,
    retryable
  };
}

/**
 * Validate storage path for security
 */
export function validateStoragePath(userId: string, storagePath: string): { valid: boolean; error?: string } {
  // Ensure path starts with userId
  if (!storagePath.startsWith(`${userId}/`)) {
    return {
      valid: false,
      error: `Invalid storage path: must start with user ID`
    };
  }

  // Basic path validation
  if (storagePath.includes('..') || storagePath.includes('//')) {
    return {
      valid: false,
      error: 'Invalid characters in storage path'
    };
  }

  return { valid: true };
}

/**
 * Retry configuration for failed uploads
 */
export const UPLOAD_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number): number {
  const delay = UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(UPLOAD_RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, UPLOAD_RETRY_CONFIG.maxDelay);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorResult = handleStorageError(error, 'check');
  return errorResult.retryable;
}

/**
 * Configuration for signed URL requests
 */
// Supabase-compliant expiry limits for immutable media
export const SIGNED_URL_CONFIG = {
  defaultExpiry: 24 * 60 * 60, // 24 hours (matches server limit for AI models)
  maxExpiry: 24 * 60 * 60, // 24 hours max (server-enforced limit)
  cacheExpiry: 12 * 60 * 60 * 1000, // 12 hours cache time
};

/**
 * Cache for signed URLs to avoid unnecessary requests
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Generate a cache key for signed URLs
 */
function getSignedUrlCacheKey(bucket: string, path: string): string {
  return `${bucket}:${path}`;
}

/**
 * Check if a cached signed URL is still valid
 */
function isSignedUrlValid(cacheKey: string): boolean {
  const cached = signedUrlCache.get(cacheKey);
  if (!cached) return false;

  // Check if URL is still valid (with some buffer time)
  return Date.now() < (cached.expiresAt - 5 * 60 * 1000); // 5 minute buffer
}

/**
 * Track failed requests to prevent infinite retry loops
 */
const failedRequests = new Map<string, { count: number; lastAttempt: number }>();
const MAX_RETRIES = 3;
const RETRY_COOLDOWN = 60000; // 1 minute cooldown after max retries

/**
 * Note: Token provider is no longer needed here since we use Supabase client directly
 * The Supabase client handles authentication via the token provider set in AuthGuard
 */

/**
 * Fetch a signed URL using Supabase client directly
 * This uses the authenticated Supabase client instead of calling an API endpoint
 */
export async function fetchSignedUrl(bucket: string, path: string, expiresIn: number = SIGNED_URL_CONFIG.defaultExpiry): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  const cacheKey = getSignedUrlCacheKey(bucket, path);
  
  // Check if we've exceeded retry limit for this path
  const failureInfo = failedRequests.get(cacheKey);
  if (failureInfo) {
    const timeSinceLastAttempt = Date.now() - failureInfo.lastAttempt;
    
    // If we've exceeded max retries and cooldown hasn't passed, reject immediately
    if (failureInfo.count >= MAX_RETRIES && timeSinceLastAttempt < RETRY_COOLDOWN) {
      return {
        success: false,
        error: 'Too many failed attempts. Please try again later.',
      };
    }
    
    // Reset counter if cooldown has passed
    if (timeSinceLastAttempt >= RETRY_COOLDOWN) {
      failedRequests.delete(cacheKey);
    }
  }

  try {
    // Import Supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('./supabase');
    
    // Use Supabase client directly - it already has authentication via Clerk token provider
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      // Track failed requests
      const currentFailureInfo = failedRequests.get(cacheKey) || { count: 0, lastAttempt: 0 };
      failedRequests.set(cacheKey, {
        count: currentFailureInfo.count + 1,
        lastAttempt: Date.now(),
      });
      
      return {
        success: false,
        error: error.message || 'Failed to generate signed URL',
      };
    }

    if (!data?.signedUrl) {
      // Track failed requests
      const currentFailureInfo = failedRequests.get(cacheKey) || { count: 0, lastAttempt: 0 };
      failedRequests.set(cacheKey, {
        count: currentFailureInfo.count + 1,
        lastAttempt: Date.now(),
      });
      
      return {
        success: false,
        error: 'No signed URL returned',
      };
    }

    // Success - clear any failure tracking
    failedRequests.delete(cacheKey);

    // Cache the signed URL
    const expiresAt = Date.now() + (expiresIn * 1000);
    signedUrlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt,
    });

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    // Track failed requests
    const currentFailureInfo = failedRequests.get(cacheKey) || { count: 0, lastAttempt: 0 };
    failedRequests.set(cacheKey, {
      count: currentFailureInfo.count + 1,
      lastAttempt: Date.now(),
    });
    
    console.error('Error fetching signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error fetching signed URL',
    };
  }
}

/**
 * Get a signed URL for secure storage access, using cache when possible
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = SIGNED_URL_CONFIG.defaultExpiry): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  // Validate parameters
  if (!bucket || typeof bucket !== 'string') {
    return { success: false, error: 'Bucket parameter is required and must be a string' };
  }

  if (!path || typeof path !== 'string') {
    return { success: false, error: 'Path parameter is required and must be a string' };
  }

  // Validate bucket is allowed
  const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
  if (!allowedBuckets.includes(bucket)) {
    return { success: false, error: `Invalid bucket. Must be one of: ${allowedBuckets.join(', ')}` };
  }

  // Validate expiry time
  if (typeof expiresIn !== 'number' || expiresIn <= 0 || expiresIn > SIGNED_URL_CONFIG.maxExpiry) {
    return { success: false, error: `expiresIn must be a positive number not exceeding ${SIGNED_URL_CONFIG.maxExpiry} seconds (1 day)` };
  }

  // Check cache first
  const cacheKey = getSignedUrlCacheKey(bucket, path);
  if (isSignedUrlValid(cacheKey)) {
    const cached = signedUrlCache.get(cacheKey)!;
    return { success: true, signedUrl: cached.url };
  }

  // Fetch new signed URL
  return await fetchSignedUrl(bucket, path, expiresIn);
}

/**
 * Clear the signed URL cache (useful for testing or when authentication changes)
 */
export function clearSignedUrlCache(): void {
  signedUrlCache.clear();
  failedRequests.clear();
}
