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
export const SIGNED_URL_CONFIG = {
  defaultExpiry: 3600, // 1 hour
  maxExpiry: 24 * 60 * 60, // 24 hours
  cacheExpiry: 50 * 60 * 1000, // 50 minutes (to ensure URLs don't expire during use)
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
 * Global token provider function that can be set by the app
 * This allows the storage utils to access Clerk tokens without React hooks
 */
let tokenProvider: (() => Promise<string | null>) | null = null;

/**
 * Set the token provider function
 */
export function setTokenProvider(provider: (() => Promise<string | null>) | null) {
  tokenProvider = provider;
}

/**
 * Get Clerk token for API requests
 * This function attempts to get the token from the token provider
 */
async function getClerkToken(): Promise<string | null> {
  if (tokenProvider) {
    try {
      return await tokenProvider();
    } catch (error) {
      console.warn('Failed to get token from provider:', error);
    }
  }
  return null;
}

/**
 * Fetch a signed URL from the API
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

  // Get Clerk token for authentication
  const token = await getClerkToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/signed-urls', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        bucket,
        path,
        expiresIn,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Track failed requests
      const currentFailureInfo = failedRequests.get(cacheKey) || { count: 0, lastAttempt: 0 };
      failedRequests.set(cacheKey, {
        count: currentFailureInfo.count + 1,
        lastAttempt: Date.now(),
      });
      
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.signedUrl) {
      // Track failed requests
      const currentFailureInfo = failedRequests.get(cacheKey) || { count: 0, lastAttempt: 0 };
      failedRequests.set(cacheKey, {
        count: currentFailureInfo.count + 1,
        lastAttempt: Date.now(),
      });
      
      return {
        success: false,
        error: 'No signed URL returned from server',
      };
    }

    // Success - clear any failure tracking
    failedRequests.delete(cacheKey);

    // Cache the signed URL
    const expiresAt = new Date(data.expiresAt).getTime();
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
    return { success: false, error: `expiresIn must be a positive number not exceeding ${SIGNED_URL_CONFIG.maxExpiry} seconds (24 hours)` };
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
}
