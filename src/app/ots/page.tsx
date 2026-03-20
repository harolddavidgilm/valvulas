'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Pencil, Trash2, X, Save } from 'lucide-react';
import HasPermission from '@/components/Auth/HasPermission';
import styles from './ots.module.css';

export default function WorkOrdersPage() {
  const [ots, setOts] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOt, setEditingOt] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch OTs
    const { data: oData, error: oError } = await supabase
      .from('ordenes_trabajo')
      .select(`
        *,
        valvulas (
          tag
        )
      `)
      .order('fecha_programada', { ascending: true });

    // Fetch Tecnicos
    const { data: tData } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (oError) {
      console.error('Error fetching OTs:', oError);
    } else {
      setOts(oData || []);
    }

    if (tData) {
      setTecnicos(tData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, numOt: string) => {
    if (window.confirm(`¿Está seguro que desea eliminar la OT ${numOt}? Esta acción no se puede deshacer.`)) {
      const { error } = await supabase.from('ordenes_trabajo').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        setOts(ots.filter(ot => ot.id !== id));
      }
    }
  };

  const openEditModal = (ot: any) => {
    setEditingOt({ ...ot });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valvulas, ...dataToUpdate } = editingOt; // Exclude joined relation
    
    const { error } = await supabase
      .from('ordenes_trabajo')
      .update(dataToUpdate)
      .eq('id', editingOt.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setIsModalOpen(false);
      fetchData();
    }
  };

  const getStatusClass = (estado: string) => {
    if (!estado) return styles.statusBorrador;
    const s = estado.toUpperCase();
    switch (s) {
      case 'BORRADOR': return styles.statusBorrador;
      case 'PROGRAMADA': return styles.statusProgramada;
      case 'EN_PROGRESO': return styles.statusEnCurso;
      case 'EJECUTADO': return styles.statusFinalizada;
      case 'CERRADA': return styles.statusFinalizada;
      default: return styles.statusBorrador;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gestión de Mantenimiento (Órdenes de Trabajo)</h2>
        <Link href="/ots/nueva" className="btn-primary">
          + Nueva OT
        </Link>
      </div>

      <div className={`${styles.tableContainer} glass`}>
        <table>
          <thead>
            <tr>
              <th>ID OT</th>
              <th>Activo (TAG)</th>
              <th>Tipo Intervención</th>
              <th>Fecha Programada</th>
              <th>Estado</th>
              <th>Técnico</th>
              <HasPermission roles={['admin']}>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </HasPermission>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem'}}>Cargando...</td></tr>
            ) : !ots || ots.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No hay órdenes de trabajo registradas.
                </td>
              </tr>
            ) : (
              ots.map((ot) => (
                <tr key={ot.id}>
                  <td>{ot.id.split('-')[0].toUpperCase()}</td>
                  <td>
                    {ot.valvulas ? (
                      <Link href={`/valvulas/${ot.valvula_id}`} className={styles.tagLink}>
                        {ot.valvulas.tag}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{ot.tipo_mantenimiento}</td>
                  <td>{new Date(ot.fecha_programada).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles.status} ${getStatusClass(ot.estado)}`}>
                      {ot.estado}
                    </span>
                  </td>
                  <td>{ot.tecnico_asignado || 'Sin Asignar'}</td>
                  <HasPermission roles={['admin']}>
                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => openEditModal(ot)} className={styles.actionBtn} title="Editar">
                        <Pencil size={16} color="#3b82f6" />
                      </button>
                      <button onClick={() => handleDelete(ot.id, ot.num_ot)} className={styles.actionBtn} title="Eliminar">
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </td>
                  </HasPermission>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN */}
      {isModalOpen && editingOt && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass`}>
            <div className={styles.modalHeader}>
              <h3>Editar Orden de Trabajo</h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdate} className={styles.editForm}>
              <div className={styles.formGroup}>
                <label>Tipo de Intervención</label>
                <select 
                  value={editingOt.tipo_mantenimiento} 
                  onChange={(e) => setEditingOt({...editingOt, tipo_mantenimiento: e.target.value})}
                >
                  <option value="PRUEBA">PRUEBA</option>
                  <option value="MANTENIMIENTO Y PRUEBA">MANTENIMIENTO Y PRUEBA</option>
                  <option value="REPARACION">REPARACION</option>
                  <option value="CALIBRACIÓN">CALIBRACIÓN</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Fecha Programada</label>
                <input 
                  type="date" 
                  value={editingOt.fecha_programada} 
                  onChange={(e) => setEditingOt({...editingOt, fecha_programada: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select 
                  value={editingOt.estado} 
                  onChange={(e) => setEditingOt({...editingOt, estado: e.target.value})}
                >
                  <option value="BORRADOR">BORRADOR</option>
                  <option value="PROGRAMADA">PROGRAMADA</option>
                  <option value="EN_PROGRESO">EN CURSO</option>
                  <option value="EJECUTADO">EJECUTADO</option>
                  <option value="CERRADA">CERRADA</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Técnico Asignado</label>
                <select 
                  value={editingOt.tecnico_asignado || ''} 
                  onChange={(e) => setEditingOt({...editingOt, tecnico_asignado: e.target.value})}
                >
                  <option value="" disabled>Seleccione un Técnico...</option>
                  {tecnicos.map(t => (
                    <option key={t.id} value={t.nombre}>{t.nombre} - {t.especialidad}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                  <Save size={18}/> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
