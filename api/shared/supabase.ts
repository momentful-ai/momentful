/**
 * Shared Supabase client for server-side API routes
 * Uses secret key (service role key) to bypass RLS policies
 * 
 * IMPORTANT: This is for server-side use only. Client-side code should use
 * the publishable key from src/lib/supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseSecretKey) {
  throw new Error(
    'SUPABASE_SECRET_KEY is required for server-side API routes. ' +
    'Please set it in your environment variables. ' +
    'This key should NEVER be exposed to the client-side.'
  );
}

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  throw new Error(
    'SUPABASE_URL or VITE_SUPABASE_URL is required for server-side API routes. ' +
    'Please set it in your environment variables.'
  );
}

/**
 * Supabase client for server-side API routes
 * Uses secret key to bypass Row Level Security (RLS)
 */
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

