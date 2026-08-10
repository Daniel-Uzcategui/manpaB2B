import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://voyatlhmdfbkpisdyqzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZveWF0bGhtZGZia3Bpc2R5cXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzODM2MzksImV4cCI6MjEwMTk1OTYzOX0.VszLQD7zdYIHgM3LQvYjiHwMiZ1xuTXM6AWEqvOlAVs';

let clientInstance: SupabaseClient | null = null;

export const useB2BSupabaseClient = (): SupabaseClient => {
  if (clientInstance) {
    return clientInstance;
  }

  const config = useRuntimeConfig();
  const url = config.public.supabase?.url || config.public.supabaseUrl || process.env.SUPABASE_URL || SUPABASE_URL;
  const key = config.public.supabase?.key || config.public.supabaseKey || process.env.SUPABASE_KEY || SUPABASE_ANON_KEY;

  clientInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
};
