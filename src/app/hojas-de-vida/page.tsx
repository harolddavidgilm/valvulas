'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Search, ChevronUp, ChevronDown, ArrowLeft, Loader2 } from 'lucide-react';
import styles from '../valvulas/valvulas.module.css';
import Link from 'next/link';

export default function HojasDeVidaPage() {
  const router = useRouter();
  const [valvulas, setValvulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'tag', direction: 'asc' });

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('valvulas').select('*');
      if (data) setValvulas(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...valvulas];
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.tag?.toLowerCase().includes(lowSearch) ||
        v.tipo?.toLowerCase().includes(lowSearch) ||
        v.fluido_servicio?.toLowerCase().includes(lowSearch)
      );
    }
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

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

  if (loading) return (
    <div className="loading">
      <Loader2 className="spinner" size={40} />
      <span>Cargando historiales...</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <button className="btn-secondary" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
          <h2>Hojas de Vida y Trazabilidad (Activos)</h2>
          <p>Seleccione una válvula para ver su historial, pruebas y configuración.</p>
        </div>
      </header>

      <div className={styles.filtersRow} style={{ marginTop: '2rem' }}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por TAG, Tipo o Fluido..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.resultsCount}>
          Total: <strong>{filteredAndSorted.length}</strong> activos
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
              <th onClick={() => handleSort('normativa')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Normativa {sortConfig.key === 'normativa' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
              <th onClick={() => handleSort('estado')} className={styles.sortable}>
                <div className={styles.headerCell}>
                  Estado {sortConfig.key === 'estado' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((v) => (
              <tr key={v.id}>
                <td className={styles.tag}>
                  <Link href={`/valvulas/${v.id}`} style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: '700' }}>
                    {v.tag}
                  </Link>
                </td>
                <td>{v.tipo}</td>
                <td>{v.fluido_servicio}</td>
                <td>{v.presion_set} psi</td>
                <td>{v.normativa}</td>
                <td>
                  <span className={`${styles.badge} ${styles[v.estado?.toLowerCase() || 'operativa']}`}>
                    {(v.estado || 'Operativa').replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAndSorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No se encontraron resultados para "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
