import { supabase } from './supabase';

export async function setSupabaseAuth(clerkToken: string) {
  const { data, error } = await supabase.auth.setSession({
    access_token: clerkToken,
    refresh_token: clerkToken,
  });

  if (error) {
    console.error('Error setting Supabase session:', error);
  }

  return data;
}
