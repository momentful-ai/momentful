import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './shared/supabase.js';
import { validateStoragePath, handleStorageError } from './shared/storage.js';

// Configuration for signed URLs
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to generate signed URLs.' });
  }

  try {
    const { bucket, path, expiresIn = SIGNED_URL_EXPIRY } = req.body || {};

    // Validate required parameters
    if (!bucket || typeof bucket !== 'string') {
      return res.status(400).json({ error: 'bucket parameter is required and must be a string' });
    }

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path parameter is required and must be a string' });
    }

    // Validate bucket is one of the allowed buckets
    const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket. Must be one of: ${allowedBuckets.join(', ')}` });
    }

    // Validate expiry time (max 24 hours)
    const maxExpiry = 24 * 60 * 60; // 24 hours in seconds
    if (typeof expiresIn !== 'number' || expiresIn <= 0 || expiresIn > maxExpiry) {
      return res.status(400).json({ error: `expiresIn must be a positive number not exceeding ${maxExpiry} seconds (24 hours)` });
    }

    // Extract user ID from the authenticated session
    // This will be validated by RLS policies when accessing the file
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = user.id;

    // Validate the storage path to ensure user can only access their own files
    const pathValidation = validateStoragePath(userId, path);
    if (!pathValidation.valid) {
      return res.status(403).json({ error: pathValidation.error });
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      const errorResult = handleStorageError(error, 'signed URL generation');
      return res.status(errorResult.success ? 200 : 500).json(errorResult);
    }

    if (!data?.signedUrl) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      expiresIn
    });

  } catch (error) {
    console.error('Unexpected error in signed URL generation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
