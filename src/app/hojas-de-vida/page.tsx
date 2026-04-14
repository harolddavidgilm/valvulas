'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
  const lastFetchRef = useRef(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase.from('valvulas').select('*');
      if (error) throw error;
      if (data) {
        setValvulas(data);
        lastFetchRef.current = Date.now();
      }
    } catch (err) {
      console.error('Error fetching valulas:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchRef.current > 5 * 60 * 1000) {
        fetchData(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
          const valStr = val.toString().replace(/,/g, '');
          const num = parseFloat(valStr);
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

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(start, start + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading && valvulas.length === 0) return (
    <div className="loading" style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
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
          Mostrando {paginatedData.length} de <strong>{filteredAndSorted.length}</strong> activos
        </div>
      </div>

      <div className="glass" style={{ marginTop: '2rem', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
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
              {paginatedData.map((v) => (
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
        </div>
        
        {filteredAndSorted.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No se encontraron resultados para "{searchTerm}".
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)'
          }}>
            <button 
              className="btn-secondary" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Página <strong>{currentPage}</strong> de {totalPages}
            </span>
            <button 
              className="btn-secondary" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '0.5rem 1rem' }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
