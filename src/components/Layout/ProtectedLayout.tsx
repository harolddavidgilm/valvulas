'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Special case for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If we are loading but already have a user, show the layout to avoid the "standby" flash
  const showLoadingScreen = loading && !user;

  if (showLoadingScreen) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--main-bg)', // Using main-bg for consistency
        color: 'var(--accent)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="spinner" size={48} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sincronizando sesión...</p>
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    return null; // Will redirect shortly
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
