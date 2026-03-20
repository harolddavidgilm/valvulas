'use client';

import Link from 'next/link';
import { Home, ClipboardList, ShieldAlert, Settings, Wrench, FileText, Calendar, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import HasPermission from '@/components/Auth/HasPermission';
import styles from './styles.module.css';

export default function Sidebar() {
  const { user, role, signOut, loading } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.profile}>
        <div className={styles.logoWrapper}>
          <img src="/logo.png" alt="Logo" className={styles.logoImg} />
        </div>
        <div className={styles.profileName}>Gestión de Mantenimiento de Activos</div>
      </div>
      <div className={styles.nav}>
        <Link href="/" className={styles.navLink}>
          <Home size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/valvulas" className={styles.navLink}>
          <ShieldAlert size={20} />
          <span>Gestión de Activos</span>
        </Link>
        <Link href="/hojas-de-vida" className={styles.navLink}>
          <FileText size={20} />
          <span>Hojas de Vida</span>
        </Link>
        <Link href="/ots" className={styles.navLink}>
          <Wrench size={20} />
          <span>Órdenes de Trabajo</span>
        </Link>
        <Link href="/programacion" className={styles.navLink}>
          <Calendar size={20} />
          <span>Programación</span>
        </Link>
        <Link href="/rbi" className={styles.navLink}>
          <ClipboardList size={20} />
          <span>Análisis RBI</span>
        </Link>
        <Link href="/inventario" className={styles.navLink}>
          <Settings size={20} />
          <span>Inventario Repuestos</span>
        </Link>
        <Link href="/reportes" className={styles.navLink}>
          <FileText size={20} />
          <span>Reportes</span>
        </Link>
        <HasPermission roles={['admin']}>
          <Link href="/usuarios" className={styles.navLink}>
            <UserIcon size={20} />
            <span>Usuarios y Roles</span>
          </Link>
        </HasPermission>
      </div>
      <div className={styles.footer}>
        {user ? (
          <div className={styles.userInfo}>
            <div className={styles.userMeta}>
              <UserIcon size={16} />
              <div className={styles.userDetails}>
                <span className={styles.userEmail}>{user.email?.split('@')[0]}</span>
                <span className={styles.userRole}>{role.toUpperCase()}</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={() => signOut()}>
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <Link href="/login" className={styles.navLink}>
            <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
            <span>Iniciar Sesión</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
