'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type Role = 'admin' | 'supervisor' | 'tecnico' | 'cliente';

export interface Empresa {
  id: string;
  nombre: string;
  rif?: string;
  direccion?: string;
  contacto_nombre?: string;
  contacto_email?: string;
  logo_url?: string;
  activa: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: any | null;
  role: Role;
  empresa: Empresa | null;
  empresaId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Silently ignore AbortError from Supabase Web Locks API — not a real error */
function isAbortError(err: unknown): boolean {
  return (err instanceof Error && err.name === 'AbortError') ||
    (typeof err === 'object' && err !== null && (err as any)?.name === 'AbortError');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Prevent concurrent fetchProfile calls
  const isFetching = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (!isAbortError(err)) console.error('checkSession error:', err);
        if (mountedRef.current) setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes.
    // Use a sync callback with an internal async IIFE so we never return a Promise
    // to onAuthStateChange — that pattern causes unhandled rejections in gotrue-js.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        void (async () => {
          try {
            if (!mountedRef.current) return;
            const currentUser = session?.user ?? null;

            if (event === 'SIGNED_IN') {
              setUser(currentUser);
              setLoading(true);
              await fetchProfile(currentUser?.id || '');
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setLoading(false);
            } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              setUser(currentUser);
              if (currentUser) {
                await fetchProfile(currentUser.id);
              }
            }
          } catch (err) {
            if (!isAbortError(err)) console.error('onAuthStateChange error:', err);
          }
        })();
      }
    );

    // Re-check session when user returns to the tab after inactivity
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      void (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!mountedRef.current) return;
          if (session?.user) {
            setUser(session.user);
            setProfile((prev: any) => {
              if (!prev?.id) fetchProfile(session.user.id);
              return prev;
            });
          } else {
            await checkSession();
          }
        } catch (err) {
          if (!isAbortError(err)) console.error('visibilitychange error:', err);
        }
      })();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Keep session alive with a silent ping every 10 minutes
    const interval = setInterval(() => {
      void supabase.auth.getSession().catch(err => {
        if (!isAbortError(err)) console.error('Session ping error:', err);
      });
    }, 10 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string) {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, empresas(*)')
        .eq('id', userId)
        .single();

      if (!mountedRef.current) return;

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile((prev: any) => prev ?? null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      if (!isAbortError(err)) console.error('fetchProfile error:', err);
    } finally {
      isFetching.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      if (!isAbortError(err)) console.error('signOut error:', err);
    }
  };

  const hasPermission = (requiredRoles: Role[]) => {
    if (!profile?.role) return false;
    if (profile.role === 'admin') return true;
    return requiredRoles.includes(profile.role);
  };

  const empresa: Empresa | null = profile?.empresas ?? null;
  const empresaId: string | null = profile?.empresa_id ?? null;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role ?? 'cliente',
      empresa,
      empresaId,
      loading,
      signOut,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
