'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './valvulas.module.css';
import Link from 'next/link';
import CsvUploadModal from '@/components/CsvUploadModal/CsvUploadModal';
import HasPermission from '@/components/Auth/HasPermission';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, Plus, Info, Loader2, ArrowLeft, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

export default function ValvulasPage() {
  const router = useRouter();
  const [valvulas, setValvulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'tag', direction: 'asc' });
  const { role } = useAuth();

  useEffect(() => {
    fetchValvulas();
  }, []);

  async function fetchValvulas() {
    const { data, error } = await supabase
      .from('valvulas')
      .select('*');
    
    if (data) setValvulas(data);
    setLoading(false);
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedValvulas = useMemo(() => {
    let result = [...valvulas];

    // Filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(v => 
        (v.tag?.toLowerCase().includes(lowSearch)) ||
        (v.fabricante?.toLowerCase().includes(lowSearch)) ||
        (v.tipo?.toLowerCase().includes(lowSearch)) ||
        (v.fluido_servicio?.toLowerCase().includes(lowSearch))
      );
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Helper to extract numbers for columns like "presion_set" (e.g., "116 psi" -> 116)
        const parseValue = (val: any) => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'number') return val;
          const num = parseFloat(val.toString().replace(/,/g, ''));
          return isNaN(num) ? val.toString().toLowerCase() : num;
        };

        const vA = parseValue(aValue);
        const vB = parseValue(bValue);

        if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [valvulas, searchTerm, sortConfig]);

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
          <button className="btn-secondary" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
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

      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por TAG, Fabricante, Tipo o Fluido..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.resultsCount}>
          Mostrando <strong>{filteredAndSortedValvulas.length}</strong> activos
        </div>
      </div>

      <div className="glass" style={{ marginTop: '2rem', overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('tag')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  TAG {sortConfig.key === 'tag' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('fabricante')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Fabricante {sortConfig.key === 'fabricante' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('tipo')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Tipo {sortConfig.key === 'tipo' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('fluido_servicio')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Fluido {sortConfig.key === 'fluido_servicio' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('presion_set')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Presión Set {sortConfig.key === 'presion_set' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('estado')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Estado {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedValvulas.map((v) => (
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
