'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type Role = 'admin' | 'supervisor' | 'tecnico' | 'cliente';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (requiredRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial fetch - get session immediately
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
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
      }
    });

    // Strategy to mitigate "standby" slowness: 
    // Refresh session when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setUser(session.user);
          } else {
            // If session is lost after standby, force a check or redirect
            checkSession();
          }
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 10 minutes to keep session alive during long standby
    const interval = setInterval(() => {
      supabase.auth.getSession();
    }, 10 * 60 * 1000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();


      if (error) {
        console.error('Error fetching profile:', error);
        setProfile({ role: 'cliente' }); // Default fallback
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Context Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (requiredRoles: Role[]) => {
    if (!profile?.role) return false;
    if (profile.role === 'admin') return true; // Admins ALWAYS have permission
    return requiredRoles.includes(profile.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role: profile?.role ?? 'cliente', 
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
