/**
 * Utility functions for generating signed URLs for external providers
 * Uses service role key for secure, time-limited access
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Generate a signed URL for external provider access
 * Uses short TTL (5 minutes) for security
 */
export async function generateExternalSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  // Validate bucket
  const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
  if (!allowedBuckets.includes(bucket)) {
    throw new Error(`Invalid bucket for external access: ${bucket}`);
  }

  // Validate expiry time (max 10 minutes)
  const maxExpiry = 10 * 60; // 10 minutes
  if (expiresIn <= 0 || expiresIn > maxExpiry) {
    throw new Error(`Invalid expiry time: ${expiresIn}`);
  }

  const { data, error } = await supabaseService.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error('Signed URL generation failed - no URL returned');
  }

  return data.signedUrl;
}

/**
 * Convert storage paths to signed URLs in an object recursively
 * Only converts string values that look like storage paths
 * Optimized to skip already-signed URLs and avoid unnecessary calls
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function convertStoragePathsToSignedUrls(obj: any): Promise<any> {
  if (typeof obj === 'string') {
    // Early return - skip if it's already a URL (including signed URLs)
    if (obj.startsWith('http://') || obj.startsWith('https://')) {
      return obj;
    }

    // Early return - skip empty strings
    if (!obj || obj.trim().length === 0) {
      return obj;
    }

    // Check if this looks like a storage path
    // Storage paths typically look like: userId/projectId/filename
    // Must have at least 3 parts separated by /
    const pathParts = obj.split('/');
    if (pathParts.length < 3) {
      return obj; // Not a storage path, return as-is
    }

    // This appears to be a storage path, convert to signed URL
    try {
      // For external providers, we assume these are in user-uploads bucket
      // The path format is: userId/projectId/filename
      return await generateExternalSignedUrl('user-uploads', obj);
    } catch (error) {
      console.error('[external-signed-urls] Failed to convert storage path:', obj, error instanceof Error ? error.message : error);
      // Return original path if conversion fails to avoid breaking the request
      return obj;
    }
  }

  // Early return for null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Early return for empty arrays
    if (obj.length === 0) {
      return obj;
    }
    return Promise.all(obj.map(convertStoragePathsToSignedUrls));
  }

  if (obj && typeof obj === 'object') {
    // Early return for empty objects
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return obj;
    }

    const result: any = {};
    for (const [key, value] of entries) {
      result[key] = await convertStoragePathsToSignedUrls(value);
    }
    return result;
  }

  return obj;
}
