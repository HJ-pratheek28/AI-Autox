'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface SessionContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Supabase not set up — read from localStorage (mock login fallback)
      const email =
        typeof window !== 'undefined'
          ? localStorage.getItem('zc_user_email') ||
            localStorage.getItem('google_auth_email') ||
            ''
          : '';

      if (email) {
        setUser({
          id: 'mock',
          email,
          full_name: email.split('@')[0],
          avatar_url: null,
        });
      }
      setIsLoading(false);
      return;
    }

    // Real Supabase session
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
        });
        // Sync email to localStorage so existing code that reads it still works
        if (typeof window !== 'undefined') {
          localStorage.setItem('zc_user_email', session.user.email!);
        }
      }
      setIsLoading(false);
    };

    init();

    // Listen for auth state changes (sign-in / sign-out)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('zc_user_email', session.user.email!);
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('zc_user_email');
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('zc_user_email');
        localStorage.removeItem('google_auth_email');
      }
    }
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <SessionContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
