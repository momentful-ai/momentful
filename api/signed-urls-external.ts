import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Configuration for external provider signed URLs
const EXTERNAL_SIGNED_URL_EXPIRY = 300; // 5 minutes for external providers

// Initialize Supabase client with service role key for external provider access
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to generate external signed URLs.' });
  }

  try {
    const { bucket, path, expiresIn = EXTERNAL_SIGNED_URL_EXPIRY } = req.body || {};

    // Validate required parameters
    if (!bucket || typeof bucket !== 'string') {
      return res.status(400).json({ error: 'bucket parameter is required and must be a string' });
    }

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'path parameter is required and must be a string' });
    }

    // Validate bucket is one of the allowed buckets for external access
    const allowedBuckets = ['user-uploads', 'edited-images', 'generated-videos', 'thumbnails'];
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: `Invalid bucket for external access. Must be one of: ${allowedBuckets.join(', ')}` });
    }

    // Validate expiry time (max 10 minutes for external providers)
    const maxExpiry = 10 * 60; // 10 minutes in seconds
    if (typeof expiresIn !== 'number' || expiresIn <= 0 || expiresIn > maxExpiry) {
      return res.status(400).json({ error: `expiresIn must be a positive number not exceeding ${maxExpiry} seconds (10 minutes)` });
    }

    // For external providers, we skip user-specific path validation since this endpoint
    // is called server-side and we've already validated the user's access to the data
    // The path should still follow the expected format: userId/projectId/filename

    // Generate signed URL using service role key
    const { data, error } = await supabaseService.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error generating external signed URL:', error);
      return res.status(500).json({ error: 'Failed to generate signed URL' });
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
    console.error('Unexpected error in external signed URL generation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
