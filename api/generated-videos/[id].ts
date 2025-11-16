import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../shared/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid id parameter' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching generated video:', error);
      return res.status(500).json({ error: 'Failed to fetch generated video' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { data, error } = await supabase
        .from('generated_videos')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error updating generated video:', error);
      return res.status(500).json({ error: 'Failed to update generated video' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('generated_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting generated video:', error);
      return res.status(500).json({ error: 'Failed to delete generated video' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
