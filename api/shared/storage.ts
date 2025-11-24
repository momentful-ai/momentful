/**
 * Storage utilities for server-side bucket management and error handling
 */

import { supabase } from './supabase.js';
import { createClient } from '@supabase/supabase-js';

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
 * Generate a signed URL for secure storage access
 */
export async function generateSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<{ success: boolean; signedUrl?: string; error?: string; expiresAt?: string }> {
  try {
    // Validate bucket
    const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
    if (!allowedBuckets.includes(bucket)) {
      return {
        success: false,
        error: `Invalid bucket. Must be one of: ${allowedBuckets.join(', ')}`
      };
    }

    // Validate expiry time (max 24 hours)
    const maxExpiry = 24 * 60 * 60; // 24 hours in seconds
    if (expiresIn <= 0 || expiresIn > maxExpiry) {
      return {
        success: false,
        error: `expiresIn must be a positive number not exceeding ${maxExpiry} seconds (24 hours)`
      };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data?.signedUrl) {
      return {
        success: false,
        error: 'Failed to generate signed URL'
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    };
  } catch (error) {
    console.error('Exception generating signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating signed URL'
    };
  }
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

/**
 * Supabase service role client for uploads
 * Uses service role key to bypass RLS and upload files
 */
const supabaseService = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Upload a file from an external URL to Supabase storage
 * Downloads the file, validates the path, and uploads using service role key
 */
export async function uploadFromExternalUrl(
  bucket: string,
  externalUrl: string,
  userId: string,
  projectId: string,
  fileType: 'image' | 'video'
): Promise<{ storagePath: string; width?: number; height?: number }> {
  // Validate bucket
  const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
  if (!allowedBuckets.includes(bucket)) {
    throw new Error(`Invalid bucket. Must be one of: ${allowedBuckets.join(', ')}`);
  }

  // Validate required environment variables
  if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for uploads');
  }

  // Validate external URL
  if (!externalUrl || typeof externalUrl !== 'string' || (!externalUrl.startsWith('http://') && !externalUrl.startsWith('https://'))) {
    throw new Error('Invalid external URL provided');
  }

  // Generate storage path based on file type
  const timestamp = Date.now();
  const fileName = fileType === 'image' 
    ? `edited-${timestamp}.png`
    : `generated-${timestamp}.mp4`;
  const storagePath = `${userId}/${projectId}/${fileName}`;

  // Validate storage path
  const pathValidation = validateStoragePath(userId, storagePath);
  if (!pathValidation.valid) {
    throw new Error(`Storage path validation failed: ${pathValidation.error}`);
  }

  try {
    // Download file from external URL
    const response = await fetch(externalUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText} (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    // Convert ArrayBuffer to Buffer for Node.js compatibility
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage using service role client
    // Supabase accepts Buffer, Blob, File, or ArrayBuffer
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileType === 'image' ? 'image/png' : 'video/mp4',
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      const errorResult = handleStorageError(uploadError, 'file upload');
      throw new Error(errorResult.error);
    }

    if (!uploadData) {
      throw new Error('Upload failed - no data returned');
    }

    // For images, get dimensions
    if (fileType === 'image') {
      try {
        const imageDimensions = await getImageDimensions(externalUrl);
        return {
          storagePath,
          width: imageDimensions.width,
          height: imageDimensions.height,
        };
      } catch (dimensionError) {
        console.error('Failed to get image dimensions:', dimensionError);
        // Return without dimensions if we can't get them
        return { storagePath };
      }
    }

    return { storagePath };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error during upload');
  }
}

/**
 * Get image dimensions from URL
 * Downloads the image and extracts dimensions from the buffer
 * Note: This is a simplified implementation. For production, consider using a library like 'sharp'
 */
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Parse PNG dimensions (simplified - works for most PNGs)
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  // Width is at bytes 16-19, Height is at bytes 20-23 (big-endian)
  if (buffer.length >= 24) {
    const signature = buffer.toString('hex', 0, 8);
    if (signature === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0 && width < 100000 && height < 100000) {
        return { width, height };
      }
    }
  }

  // If PNG parsing fails, try JPEG
  // JPEG: FF D8 ... FF C0 ... width at offset +5, height at offset +7 (big-endian)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // Find SOF0 marker (FF C0)
    for (let i = 2; i < buffer.length - 7; i++) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xC0) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        if (width > 0 && height > 0 && width < 100000 && height < 100000) {
          return { width, height };
        }
        break;
      }
    }
  }

  // If we can't parse dimensions, throw error - client should handle this case
  throw new Error('Unable to determine image dimensions from file format');
}
