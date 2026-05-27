import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This API route is called from the client-side auth callback page.
// It verifies the user's JWT access token, then safely upserts their profile
// in the database using the bypass-RLS admin client.
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('your-service')) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 500 });
    }

    // Create admin client
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validate the user's token
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);

    if (userErr || !user) {
      console.error('[Sync Profile] Token validation failed:', userErr?.message);
      return NextResponse.json({ error: 'Token validation failed' }, { status: 401 });
    }

    console.log(`[Sync Profile] Synchronizing profile for: ${user.email}`);

    // Upsert the profile table entry using the admin client
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
      console.error('[Sync Profile] Database upsert failed:', profileErr.message);
      return NextResponse.json({ error: `Database upsert failed: ${profileErr.message}` }, { status: 500 });
    }

    console.log(`[Sync Profile] Profile successfully saved for: ${user.email}`);
    return NextResponse.json({ success: true, user: { email: user.email } }, { status: 200 });

  } catch (err: any) {
    console.error('[Sync Profile] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
