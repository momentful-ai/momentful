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
