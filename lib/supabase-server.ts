import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client using the service role key.
// NEVER expose this client to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const isPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('placeholder') ||
  !serviceRoleKey ||
  serviceRoleKey.includes('your-service');

export const supabaseAdmin = isPlaceholder
  ? (null as any)
  : createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

export const isSupabaseAdminConfigured = !isPlaceholder;
