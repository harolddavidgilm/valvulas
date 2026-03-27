'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Key, Mail, Loader2, AlertCircle } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Attempting login with:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login result:', { hasData: !!data, error: error?.message });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        console.log('Login successful, navigating to dashboard...');
        router.push('/');
        
        // Safety fallback: if navigation doesn't happen in 3 seconds, force it
        const timeout = setTimeout(() => {
          if (window.location.pathname === '/login') {
            console.warn('Navigation taking too long, forcing with window.location');
            window.location.href = '/';
          }
        }, 3000);
        
        return () => clearTimeout(timeout);
      }
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError(err.message || 'Error inesperado');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logoCircle}>
            <img src="/logo.png" alt="Logo" className={styles.logoImg} />
          </div>
          <h1>VALVEINTEGRITY</h1>
          <p>Gestión de Mantenimiento de Activos</p>
        </header>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="usuario@empresa.com"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <div className={styles.inputWrapper}>
              <Key size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error === 'Invalid login credentials' ? 'Credenciales incorrectas' : error}</span>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : 'Iniciar Sesión'}
          </button>
        </form>

        <footer className={styles.footer}>
          <div className={styles.poweringProgress}>POWERING PROGRESS</div>
          <div className={styles.copyright}>© 2026 Nexatech - Todos los derechos reservados</div>
        </footer>
      </div>
    </div>
  );
}
