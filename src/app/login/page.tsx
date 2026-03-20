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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logoCircle}>
            <LogIn size={40} />
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
          Acceso restringido a personal autorizado.
        </footer>
      </div>
    </div>
  );
}
