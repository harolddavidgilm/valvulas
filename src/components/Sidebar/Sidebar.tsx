'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Home, ClipboardList, ShieldAlert, Settings2, Wrench, FileText, Calendar, LogOut, User as UserIcon, ChevronUp, ChevronDown, ChevronRight, Menu, X, Building2, Tags, Factory } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import HasPermission from '@/components/Auth/HasPermission';
import styles from './styles.module.css';

export default function Sidebar() {
  const { user, role, signOut, loading } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const [showTopArrow, setShowTopArrow] = useState(false);
  const [showBottomArrow, setShowBottomArrow] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setShowTopArrow(scrollTop > 10);
      setShowBottomArrow(scrollTop + clientHeight < scrollHeight - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [loading]);

  return (
    <>
      {/* Mobile Top Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>
          <img src="/logo.png" alt="Logo" className={styles.mobileLogoImg} />
          <span>V-INTEGRITY</span>
        </div>
        <button className={styles.menuToggle} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.profile}>
          <div className={styles.logoWrapper}>
            <img src="/logo.png" alt="Logo" className={styles.logoImg} />
          </div>
          <div className={styles.profileName}>Gestión de Mantenimiento de Activos</div>
        </div>
        <div className={styles.navContainer}>
          {showTopArrow && (
            <div className={`${styles.scrollIndicator} ${styles.topIndicator}`}>
              <ChevronUp size={16} />
            </div>
          )}
          <div className={styles.nav} ref={navRef} onScroll={checkScroll}>
            <Link href="/" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            <Link href="/valvulas" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <ShieldAlert size={20} />
              <span>Gestión de Activos</span>
            </Link>
            <Link href="/hojas-de-vida" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <FileText size={20} />
              <span>Hojas de Vida</span>
            </Link>
            <Link href="/ots" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <Wrench size={20} />
              <span>Órdenes de Trabajo</span>
            </Link>
            <Link href="/programacion" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <Calendar size={20} />
              <span>Programación</span>
            </Link>
            <Link href="/rbi" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <ClipboardList size={20} />
              <span>Análisis RBI</span>
            </Link>
            <Link href="/inventario" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <Settings2 size={20} />
              <span>Inventario Repuestos</span>
            </Link>
            <Link href="/reportes" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <FileText size={20} />
              <span>Reportes</span>
            </Link>
            <HasPermission roles={['admin', 'supervisor']}>
              <Link href="/tecnicos" className={styles.navLink} onClick={() => setIsOpen(false)}>
                <UserIcon size={20} />
                <span>Técnicos (Personal)</span>
              </Link>
            </HasPermission>

            {/* ── Menú Configuración ── */}
            <div className={styles.configGroup}>
              <button
                className={`${styles.navLink} ${styles.configToggle} ${configOpen ? styles.configToggleOpen : ''}`}
                onClick={() => setConfigOpen(!configOpen)}
                aria-expanded={configOpen}
              >
                <Settings2 size={20} />
                <span>Configuración</span>
                <ChevronRight size={14} className={styles.configChevron} />
              </button>

              <div className={`${styles.configSubmenu} ${configOpen ? styles.configSubmenuOpen : ''}`}>
                <HasPermission roles={['admin']}>
                  <Link href="/empresas" className={styles.subNavLink} onClick={() => setIsOpen(false)}>
                    <Building2 size={16} />
                    <span>Empresas</span>
                  </Link>
                </HasPermission>
                <HasPermission roles={['admin']}>
                  <Link href="/usuarios" className={styles.subNavLink} onClick={() => setIsOpen(false)}>
                    <UserIcon size={16} />
                    <span>Usuarios y Roles</span>
                  </Link>
                </HasPermission>
                <Link href="/configuracion/clasificaciones" className={styles.subNavLink} onClick={() => setIsOpen(false)}>
                  <Tags size={16} />
                  <span>Clasificaciones</span>
                </Link>
                <Link href="/configuracion/unidades" className={styles.subNavLink} onClick={() => setIsOpen(false)}>
                  <Factory size={16} />
                  <span>Unidad / Sistema</span>
                </Link>
              </div>
            </div>
          </div>
          {showBottomArrow && (
            <div className={`${styles.scrollIndicator} ${styles.bottomIndicator}`}>
              <ChevronDown size={16} />
            </div>
          )}
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
            <Link href="/login" className={styles.navLink} onClick={() => setIsOpen(false)}>
              <LogOut size={20} style={{ transform: 'rotate(180deg)' }} />
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
