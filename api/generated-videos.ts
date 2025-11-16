import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './shared/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid projectId parameter' });
    }

    try {
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(data || []);
    } catch (error) {
      console.error('Error fetching generated videos:', error);
      return res.status(500).json({ error: 'Failed to fetch generated videos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { project_id, user_id } = req.body || {};

      // Validate required fields
      if (!project_id || typeof project_id !== 'string' || !project_id.trim()) {
        return res.status(400).json({ error: 'project_id is required and cannot be empty' });
      }
      if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
        return res.status(400).json({ error: 'user_id is required and cannot be empty' });
      }

      const { data, error } = await supabase
        .from('generated_videos')
        .insert({
          ...req.body,
          project_id: project_id.trim(),
          user_id: user_id.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error) {
      console.error('Error creating generated video:', error);
      return res.status(500).json({ error: 'Failed to create generated video' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
