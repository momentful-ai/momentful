import { createClient } from '@supabase/supabase-js';
import { isLocalhost, getLocalOverride, isLocalBypassEnabled } from './local-mode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseLocalUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://127.0.0.1:54321';
const supabaseLocalAnonKey = import.meta.env.VITE_SUPABASE_LOCAL_ANON_KEY || supabaseAnonKey; // fallback to hosted key if local not set

const useLocal = (() => {
  const override = getLocalOverride('DEV_SUPABASE_BACKEND'); // 'hosted' | 'local'
  if (override) {
    const useLocalOverride = override === 'local' && isLocalhost();
    // Only use local if we have local config available
    return useLocalOverride && supabaseLocalUrl && supabaseLocalAnonKey;
  }
  if (isLocalBypassEnabled()) {
    // For bypass mode, prefer local if available
    return supabaseLocalUrl && supabaseLocalAnonKey;
  }
  return isLocalhost() && import.meta.env.VITE_USE_LOCAL_SUPABASE_ON_LOCALHOST === 'true' && supabaseLocalUrl && supabaseLocalAnonKey;
})();

const url = useLocal ? supabaseLocalUrl : supabaseUrl;
const anon = useLocal ? supabaseLocalAnonKey : supabaseAnonKey;

// Validate required configuration
if (!url || !anon) {
  throw new Error(
    `Missing Supabase configuration. Required: ${!url ? 'URL' : ''} ${!anon ? 'anon key' : ''}. ` +
    `Using ${useLocal ? 'local' : 'hosted'} backend. ` +
    'Check your environment variables or dev toolbar settings.'
  );
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
