import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../shared/supabase.js';

const DEFAULT_IMAGE_LIMIT = 10;
const DEFAULT_VIDEO_LIMIT = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  try {
    // Try to fetch existing limits
    const { data: existingLimits, error: fetchError } = await supabase
      .from('user_generation_limits')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no record exists, create one with defaults
    if (fetchError || !existingLimits) {
      const { data: newLimits, error: createError } = await supabase
        .from('user_generation_limits')
        .insert({
          user_id: userId,
          images_remaining: DEFAULT_IMAGE_LIMIT,
          videos_remaining: DEFAULT_VIDEO_LIMIT,
          images_limit: DEFAULT_IMAGE_LIMIT,
          videos_limit: DEFAULT_VIDEO_LIMIT,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user generation limits:', createError);
        return res.status(500).json({
          error: 'Failed to create user generation limits',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined,
        });
      }

      return res.status(200).json({
        imagesRemaining: newLimits.images_remaining,
        videosRemaining: newLimits.videos_remaining,
        imagesLimit: newLimits.images_limit,
        videosLimit: newLimits.videos_limit,
      });
    }

    // Return existing limits
    return res.status(200).json({
      imagesRemaining: existingLimits.images_remaining,
      videosRemaining: existingLimits.videos_remaining,
      imagesLimit: existingLimits.images_limit,
      videosLimit: existingLimits.videos_limit,
    });
  } catch (error) {
    console.error('Error fetching user generation limits:', error);
    return res.status(500).json({
      error: 'Failed to fetch user generation limits',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
    });
  }
}
