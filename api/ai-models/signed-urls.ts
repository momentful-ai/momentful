/**
 * Signed URLs API endpoint for AI model operations
 * 
 * This endpoint is specifically for AI model workflows (Replicate, Runway, etc.)
 * where server-side signed URLs are needed for external provider access.
 * 
 * For client-side media display, use Supabase client directly:
 * supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../shared/supabase.js';
import { validateStoragePath, handleStorageError } from '../shared/storage.js';

// Configuration for signed URLs
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Early return for OPTIONS (CORS preflight) - no processing needed
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Early validation - fail fast for non-POST requests
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method not allowed. Use POST to generate signed URLs.' });
  }

  // Set CORS headers for POST responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Early validation - fail fast if body is missing
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { bucket, path, expiresIn = SIGNED_URL_EXPIRY } = req.body;

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

    // Early validation - check auth header before any processing
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or invalid Authorization header.' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Early validation - check environment variables before processing
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabasePublishableKey) {
      console.error('[ai-models/signed-urls] Missing Supabase configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create a user client with the token to validate the user
    const { createClient } = await import('@supabase/supabase-js');
    const userClient = createClient(supabaseUrl, supabasePublishableKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Validate the token and get user info
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error('[ai-models/signed-urls] Auth error:', authError?.message || 'No user');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate the storage path to ensure user can only access their own files
    const pathValidation = validateStoragePath(user.id, path);
    if (!pathValidation.valid) {
      return res.status(403).json({ error: pathValidation.error });
    }

    // Generate signed URL using service role client
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('[ai-models/signed-urls] Storage error:', error.message);
      const errorResult = handleStorageError(error, 'signed URL generation');
      return res.status(errorResult.success ? 200 : 500).json(errorResult);
    }

    if (!data?.signedUrl) {
      console.warn('[ai-models/signed-urls] No signed URL returned for:', { bucket, path });
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      expiresIn
    });

  } catch (error) {
    console.error('[ai-models/signed-urls] Unexpected error:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

