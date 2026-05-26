import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const isPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('placeholder') ||
  supabaseUrl === 'your-supabase-url';

// Browser-side singleton Supabase client.
// When Supabase is not yet configured (placeholder URL) this still exports a
// client object so the app doesn't crash — auth calls will simply fail and the
// mock login fallback kicks in.
export const supabase = isPlaceholder
  ? (null as any) // mock mode: suppress all Supabase calls
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

export const isSupabaseConfigured = !isPlaceholder;
