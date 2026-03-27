'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './valvulas.module.css';
import Link from 'next/link';
import CsvUploadModal from '@/components/CsvUploadModal/CsvUploadModal';
import HasPermission from '@/components/Auth/HasPermission';
import { useAuth } from '@/context/AuthContext';
import { Trash2, Edit2, Plus, Info, Loader2 } from 'lucide-react';

export default function ValvulasPage() {
  const [valvulas, setValvulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();

  useEffect(() => {
    fetchValvulas();
  }, []);

  async function fetchValvulas() {
    const { data, error } = await supabase
      .from('valvulas')
      .select('*')
      .order('tag', { ascending: true });
    
    if (data) setValvulas(data);
    setLoading(false);
  }

  async function deleteValve(id: string) {
    if (!confirm('¿Está seguro de eliminar este activo? Esta acción no se puede deshacer.')) return;
    
    const { error } = await supabase.from('valvulas').delete().eq('id', id);
    if (!error) {
      setValvulas(valvulas.filter(v => v.id !== id));
    } else {
      alert('Error al eliminar: ' + error.message);
    }
  }

  if (loading) return (
    <div className="loading" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Loader2 className="spinner" size={40} />
      <span>Cargando inventario de activos...</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h2>Gestión de Activos (Válvulas PSV/PRV)</h2>
          <p>Inventario centralizado y trazabilidad técnica</p>
        </div>
        
        <HasPermission roles={['admin', 'supervisor', 'tecnico']}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <CsvUploadModal />
            <Link href="/valvulas/nueva" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Agregar Válvula
            </Link>
          </div>
        </HasPermission>
      </div>

      <div className="glass" style={{ marginTop: '2rem', overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>TAG</th>
              <th>Fabricante</th>
              <th>Tipo</th>
              <th>Fluido</th>
              <th>Presión Set</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {valvulas?.map((v) => (
              <tr key={v.id}>
                <td className={styles.tag}>
                  <Link href={`/valvulas/${v.id}`} style={{ color: 'var(--accent-purple)', fontWeight: '700', textDecoration: 'none' }}>
                    {v.tag}
                  </Link>
                </td>
                <td style={{ fontWeight: '600', color: '#475569' }}>{v.fabricante || '---'}</td>
                <td><span style={{ fontSize: '0.75rem', fontWeight: '700', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>{v.tipo}</span></td>
                <td>{v.fluido_servicio}</td>
                <td>{v.presion_set} psi</td>
                <td>
                  <span className={`${styles.badge} ${styles[v.estado?.toLowerCase() || 'operativa']}`}>
                    {(v.estado || 'operativa').replace('_', ' ')}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Link href={`/valvulas/${v.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }} title="Ver Historial">
                      <Info size={14} />
                    </Link>
                    
                    <HasPermission roles={['admin', 'supervisor']}>
                      <Link href={`/valvulas/${v.id}/editar`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                        <Edit2 size={14} />
                      </Link>
                    </HasPermission>

                    <HasPermission roles={['admin']}>
                      <button 
                        onClick={() => deleteValve(v.id)} 
                        className="btn-danger" 
                        style={{ fontSize: '0.75rem', padding: '6px 10px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </HasPermission>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {valvulas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No hay válvulas registradas en el sistema.
          </div>
        )}
      </div>
    </div>
  );
}
