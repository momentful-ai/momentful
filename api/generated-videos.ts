import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.warn('⚠️  VITE_SUPABASE_SERVICE_ROLE_KEY not set. API endpoints may not work properly.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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
      const { data, error } = await supabase
        .from('generated_videos')
        .insert(req.body)
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
