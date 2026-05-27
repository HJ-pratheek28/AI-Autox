'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import { RefreshCw } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusText, setStatusText] = useState('Initializing Google Handshake...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log('[Auth Callback] Supabase is not configured, redirecting straight to dashboard.');
      router.push('/dashboard');
      return;
    }

    const handleSessionSync = async (session: any) => {
      if (syncAttempted.current) return;
      syncAttempted.current = true;
      
      setStatusText('Synchronizing profile details...');
      try {
        const response = await fetch('/api/auth/sync-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to synchronize profile');
        }

        console.log('[Auth Callback] Profile successfully sync\'d with database.');
        setStatusText('Profile sync\'d! Redirecting to Dashboard...');
        
        // Sync local storage so existing legacy components work
        if (session.user?.email && typeof window !== 'undefined') {
          localStorage.setItem('zc_user_email', session.user.email);
        }

        router.push('/dashboard');
      } catch (err: any) {
        console.error('[Auth Callback] Profile sync error:', err.message);
        setErrorMsg(`Profile Sync Failed: ${err.message}`);
        setTimeout(() => {
          router.push('/login?error=sync_failed');
        }, 4000);
      }
    };

    const checkSession = async () => {
      console.log('[Auth Callback] Fetching initial session...');
      
      // 1. Check for errors returned in the URL search params or hash fragments
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1)); // strip '#'
      
      const urlError = urlParams.get('error') || hashParams.get('error');
      const urlErrorDesc = urlParams.get('error_description') || hashParams.get('error_description');

      if (urlError) {
        console.error('[Auth Callback] OAuth callback returned an error:', urlError, urlErrorDesc);
        setErrorMsg(`OAuth Error: ${decodeURIComponent(urlErrorDesc || urlError)}`);
        setTimeout(() => router.push('/login?error=oauth_error'), 5000);
        return;
      }

      // 2. Check for explicit token parameters (Implicit Flow) in hash fragment
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          console.log('[Auth Callback] Token found in hash fragment, activating session...');
          setStatusText('Activating secure session...');
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionErr) throw sessionErr;

          if (sessionData.session) {
            console.log('[Auth Callback] Hash session activation successful.');
            await handleSessionSync(sessionData.session);
            return;
          }
        } catch (err: any) {
          console.error('[Auth Callback] Hash session activation failed:', err.message);
          setErrorMsg(`Session activation failed: ${err.message}`);
          setTimeout(() => router.push('/login?error=activation_failed'), 3000);
          return;
        }
      }

      // 3. Check for standard auth code (PKCE Flow) in search query parameters
      const code = urlParams.get('code');

      if (code) {
        try {
          console.log('[Auth Callback] Code found in URL, performing client-side manual exchange...');
          setStatusText('Exchanging Google handshake token...');
          const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeErr) {
            throw exchangeErr;
          }
          
          if (exchangeData.session) {
            console.log('[Auth Callback] Client-side manual exchange successful.');
            await handleSessionSync(exchangeData.session);
            return;
          }
        } catch (err: any) {
          console.error('[Auth Callback] Client-side manual exchange failed:', err.message);
          setErrorMsg(`Handshake failed: ${err.message}`);
          setTimeout(() => router.push('/login?error=handshake_failed'), 3000);
          return;
        }
      }

      // 4. Default: Check if session is already parsed and active
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth Callback] Get session error:', error.message);
        setErrorMsg(error.message);
        setTimeout(() => router.push('/login?error=auth_failed'), 3000);
        return;
      }

      if (data.session) {
        console.log('[Auth Callback] Active session detected immediately.');
        await handleSessionSync(data.session);
      } else {
        // Listen to state changes to capture the session once parsed in the browser
        console.log('[Auth Callback] No immediate session, setting up listener...');
        const { data: listener } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
          console.log('[Auth Callback] Auth state event:', event);
          if (session) {
            listener.subscription.unsubscribe();
            await handleSessionSync(session);
          }
        });

        // Set a fallback timeout in case the authentication exchange completely hangs
        const timeout = setTimeout(() => {
          listener.subscription.unsubscribe();
          setErrorMsg('Authentication handshake timed out.');
          setTimeout(() => router.push('/login?error=timeout'), 3000);
        }, 10000);

        return () => {
          clearTimeout(timeout);
          listener.subscription.unsubscribe();
        };
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 overflow-hidden font-sans">
      {/* Background dot grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="w-full max-w-sm p-8 text-center space-y-6 relative z-10 glass-panel rounded-2xl border border-white/5 bg-neutral-900/60 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25 flex items-center justify-center mx-auto shadow-inner">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-white tracking-widest uppercase">
            {errorMsg ? 'Google Handshake Error' : 'Establishing Secure Session'}
          </h2>
          <p className="text-[10px] text-white/50 leading-relaxed font-medium">
            {errorMsg ? errorMsg : statusText}
          </p>
        </div>
      </div>
    </div>
  );
}
