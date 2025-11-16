/**
 * Storage utilities for server-side bucket management and error handling
 */

import { supabase } from './supabase.js';

export interface BucketConfig {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}


// Required buckets for the application
export const REQUIRED_BUCKETS: BucketConfig[] = [
  {
    id: 'user-uploads',
    name: 'user-uploads',
    public: false,
    file_size_limit: 104857600, // 100MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
  },
  {
    id: 'edited-images',
    name: 'edited-images',
    public: false,
    file_size_limit: 52428800, // 50MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'generated-videos',
    name: 'generated-videos',
    public: false,
    file_size_limit: 209715200, // 200MB
    allowed_mime_types: ['video/mp4', 'video/webm']
  },
  {
    id: 'thumbnails',
    name: 'thumbnails',
    public: false,
    file_size_limit: 5242880, // 5MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  }
];

/**
 * Check if a bucket exists
 */
export async function bucketExists(bucketId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error checking buckets:', error);
      return false;
    }

    return data?.some(bucket => bucket.id === bucketId) ?? false;
  } catch (error) {
    console.error('Exception checking bucket existence:', error);
    return false;
  }
}

/**
 * Create a single bucket with proper configuration
 */
export async function createBucket(config: BucketConfig): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bucket already exists
    if (await bucketExists(config.id)) {
      return { success: true };
    }

    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket(config.id, {
      public: config.public,
      fileSizeLimit: config.file_size_limit,
      allowedMimeTypes: config.allowed_mime_types
    });

    if (createError) {
      console.error(`Error creating bucket ${config.id}:`, createError);
      return { success: false, error: createError.message };
    }

    console.log(`✅ Created bucket: ${config.id}`);
    return { success: true };
  } catch (error) {
    console.error(`Exception creating bucket ${config.id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Ensure all required buckets exist, creating them if necessary
 */
export async function ensureBucketsExist(): Promise<{ success: boolean; created: string[]; errors: string[] }> {
  const results = { created: [] as string[], errors: [] as string[] };

  for (const bucketConfig of REQUIRED_BUCKETS) {
    const result = await createBucket(bucketConfig);

    if (result.success) {
      if (await bucketExists(bucketConfig.id)) {
        // Only count as created if it didn't exist before
        results.created.push(bucketConfig.id);
      }
    } else {
      results.errors.push(`${bucketConfig.id}: ${result.error}`);
    }
  }

  const success = results.errors.length === 0;
  return { success, ...results };
}

/**
 * Get list of missing buckets
 */
export async function getMissingBuckets(): Promise<string[]> {
  const existingBuckets = new Set();

  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (!error && data) {
      data.forEach(bucket => existingBuckets.add(bucket.id));
    }
  } catch (error) {
    console.error('Error listing buckets:', error);
  }

  return REQUIRED_BUCKETS
    .filter((bucket: BucketConfig) => !existingBuckets.has(bucket.id))
    .map((bucket: BucketConfig) => bucket.id);
}

/**
 * Validate bucket access for a given user and path
 */
export function validateStoragePath(userId: string, storagePath: string): { valid: boolean; error?: string } {
  // Ensure path starts with userId
  if (!storagePath.startsWith(`${userId}/`)) {
    return {
      valid: false,
      error: `Storage path must start with user ID: ${userId}/`
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
 * Handle storage errors gracefully
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
  let userMessage = 'Storage operation failed';

  switch (statusCode) {
    case 404:
      if (errorMessage.includes('Bucket not found')) {
        userMessage = 'Storage bucket not found. Please contact support.';
      } else {
        userMessage = 'File not found';
      }
      break;

    case 403:
      userMessage = 'Access denied to storage';
      break;

    case 413:
      userMessage = 'File too large for upload';
      retryable = false;
      break;

    case 429:
      userMessage = 'Too many requests. Please try again later.';
      retryable = true;
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      userMessage = 'Storage service temporarily unavailable. Please try again.';
      retryable = true;
      break;

    default:
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        userMessage = 'Network error. Please check your connection and try again.';
        retryable = true;
      }
      break;
  }

  return {
    success: false,
    error: userMessage,
    retryable
  };
}
