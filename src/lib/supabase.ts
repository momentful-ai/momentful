import { createClient } from '@supabase/supabase-js';
import { isLocalhost, getLocalOverride, isLocalBypassEnabled } from './local-mode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_PUBLISHABLE_KEY || '';

const supabaseLocalUrl = import.meta.env.VITE_SUPABASE_LOCAL_URL || 'http://127.0.0.1:54321';
const supabaseLocalPublishableKey = import.meta.env.VITE_SUPABASE_LOCAL_PUBLISHABLE_KEY || import.meta.env.SUPABASE_LOCAL_PUBLISHABLE_KEY || supabasePublishableKey; // fallback to hosted key if local not set

const useLocal = (() => {
  const override = getLocalOverride('DEV_SUPABASE_BACKEND'); // 'hosted' | 'local'
  if (override) {
    const useLocalOverride = override === 'local' && isLocalhost();
    // Only use local if we have local config available
    return useLocalOverride && supabaseLocalUrl && supabaseLocalPublishableKey;
  }
  if (isLocalBypassEnabled()) {
    // For bypass mode, prefer local if available
    return supabaseLocalUrl && supabaseLocalPublishableKey;
  }
  return isLocalhost() && import.meta.env.VITE_USE_LOCAL_SUPABASE_ON_LOCALHOST === 'true' && supabaseLocalUrl && supabaseLocalPublishableKey;
})();

const url = useLocal ? supabaseLocalUrl : supabaseUrl;
const publishableKey = useLocal ? supabaseLocalPublishableKey : supabasePublishableKey;

// Validate required configuration
if (!url || !publishableKey) {
  throw new Error(
    `Missing Supabase configuration. Required: ${!url ? 'URL' : ''} ${!publishableKey ? 'publishable key' : ''}. ` +
    `Using ${useLocal ? 'local' : 'hosted'} backend. ` +
    'Check your environment variables or dev toolbar settings.'
  );
}

// Global access token provider that will be updated by Clerk session
let clerkTokenProvider: (() => Promise<string>) | null = null;

export const setClerkTokenProvider = (provider: (() => Promise<string>) | null) => {
  clerkTokenProvider = provider;
};

export const supabase = createClient(url, publishableKey, {
  accessToken: async () => {
    if (clerkTokenProvider) {
      return await clerkTokenProvider();
    }
    // Fallback to anon key if no Clerk token provider is set (for bypass mode)
    return publishableKey;
  },
  auth: {
    persistSession: false, // Disable Supabase session persistence since we're using Clerk
    autoRefreshToken: false, // Disable Supabase token refresh since Clerk handles this
  },
});
