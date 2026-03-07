import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fallbackSupabaseUrl = 'https://utzcyevsjjdgbmvaxqyq.supabase.co';
const fallbackSupabaseKey = 'sb_publishable_KGIKMh8KyIJcjzDqA5I6lw_iND07gI7';

export const supabase = createClient(
  supabaseUrl || fallbackSupabaseUrl,
  supabaseKey || fallbackSupabaseKey
);
