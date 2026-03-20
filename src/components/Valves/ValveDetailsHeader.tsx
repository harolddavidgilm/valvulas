'use client';

import Link from 'next/link';
import { Hammer, Wrench } from 'lucide-react';
import HasPermission from '@/components/Auth/HasPermission';
import styles from './header.module.css';

interface ValveDetailsHeaderProps {
  id: string;
  tag: string;
}

export default function ValveDetailsHeader({ id, tag }: ValveDetailsHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleInfo}>
        <Link href="/valvulas" className={styles.backBtn}>← Volver al inventario</Link>
        <h2>Hoja de Vida: {tag}</h2>
      </div>
      
      <HasPermission roles={['admin', 'supervisor', 'tecnico']}>
        <div className={styles.actions} style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href={`/valvulas/${id}/reparacion`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hammer size={18} /> Registrar Reparación
          </Link>
          <Link href={`/valvulas/${id}/prueba`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} /> Registrar Prueba
          </Link>
        </div>
      </HasPermission>
    </header>
  );
}
