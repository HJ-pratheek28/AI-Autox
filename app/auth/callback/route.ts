import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Auth callback route: Google OAuth redirects here after login.
// We exchange the code for a session, upsert the user profile in Supabase,
// then redirect to the dashboard.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    console.error('[Auth Callback] No code in callback URL');
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    // Supabase not configured — skip real auth, go straight to dashboard
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Exchange the code for a session using a one-time client
  const supabase = createClient(supabaseUrl, supabaseAnonKey!);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('[Auth Callback] Session exchange failed:', error?.message);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const user = data.session.user;
  console.log(`[Auth Callback] Signed in: ${user.email}`);

  // Upsert profile using the admin client (bypasses RLS)
  if (serviceRoleKey && !serviceRoleKey.includes('your-service')) {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        smtp_email: user.email!,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileErr) {
      console.error('[Auth Callback] Profile upsert failed:', profileErr.message);
    } else {
      console.log(`[Auth Callback] Profile saved for ${user.email}`);
    }
  }

  // Redirect to dashboard — session cookie is set by Supabase client
  const redirectUrl = `${origin}${next}`;
  return NextResponse.redirect(redirectUrl);
}
