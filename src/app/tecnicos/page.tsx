'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, HardHat, Phone, Mail, CheckCircle2, 
  XCircle, Plus, Loader2, ArrowLeft, Trash2, Edit
} from 'lucide-react';
import styles from './tecnicos.module.css';
import Link from 'next/link';

export default function TecnicosPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [ots, setOts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: 'Mecánico',
    telefono: '',
    email: '',
    activo: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // Fetch tecnicos
    const { data: tData, error: tErr } = await supabase
      .from('tecnicos')
      .select('*')
      .order('nombre', { ascending: true });

    // Fetch OTs to calculate workload
    const { data: oData, error: oErr } = await supabase
      .from('ordenes_trabajo')
      .select('tecnico_asignado, valvula_id, estado');

    if (tData) setTecnicos(tData);
    if (oData) setOts(oData);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('tecnicos')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Técnico actualizado');
      } else {
        // Insert
        const { error } = await supabase
          .from('tecnicos')
          .insert([formData]);
        if (error) throw error;
        alert('Técnico registrado exitosamente');
      }
      
      setIsAddingMode(false);
      setEditingId(null);
      setFormData({ nombre: '', especialidad: 'Mecánico', telefono: '', email: '', activo: true });
      fetchData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(t: any) {
    setFormData({
      nombre: t.nombre,
      especialidad: t.especialidad || 'Mecánico',
      telefono: t.telefono || '',
      email: t.email || '',
      activo: t.activo
    });
    setEditingId(t.id);
    setIsAddingMode(true);
  }

  async function toggleStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('tecnicos')
      .update({ activo: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setTecnicos(tecnicos.map(t => t.id === id ? { ...t, activo: !currentStatus } : t));
    }
  }

  const workloads = useMemo(() => {
    const map = new Map();
    tecnicos.forEach(t => {
      const assignedOts = ots.filter(ot => ot.tecnico_asignado === t.nombre);
      const pendingOts = assignedOts.filter(ot => ot.estado !== 'EJECUTADO' && ot.estado !== 'CERRADA').length;
      const uniqueValves = new Set(assignedOts.map(ot => ot.valvula_id)).size;
      map.set(t.nombre, {
        total: assignedOts.length,
        pending: pendingOts,
        valves: uniqueValves
      });
    });
    return map;
  }, [tecnicos, ots]);

  const getWorkload = (nombreTecnico: string) => {
    return workloads.get(nombreTecnico) || { total: 0, pending: 0, valves: 0 };
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <button className="btn-secondary" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
          <h1>Directorio de Técnicos</h1>
          <p>Gestión del personal de mantenimiento y carga de trabajo</p>
        </div>
        {(role === 'admin' || role === 'supervisor') && (
          <button 
            className="btn-primary" 
            onClick={() => {
              setEditingId(null);
              setFormData({ nombre: '', especialidad: 'Mecánico', telefono: '', email: '', activo: true });
              setIsAddingMode(!isAddingMode);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isAddingMode ? 'Cancelar' : <><Plus size={20} /> Nuevo Técnico</>}
          </button>
        )}
      </header>

      {isAddingMode && (
        <div className={`${styles.addCard} glass`}>
          <h3>{editingId ? 'Editar Técnico' : 'Registrar Nuevo Técnico'}</h3>
          <form onSubmit={handleSubmit} className={styles.addForm}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Carlos Ramírez"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Especialidad</label>
                <select 
                  value={formData.especialidad}
                  onChange={e => setFormData({...formData, especialidad: e.target.value})}
                >
                  <option value="Mecánico">Mecánico de Válvulas</option>
                  <option value="Instrumentista">Instrumentista</option>
                  <option value="Inspector">Inspector / QA</option>
                  <option value="Ayudante">Ayudante General</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  value={formData.telefono}
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="carlos@empresa.com"
                />
              </div>
              <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexDirection: 'row' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.activo}
                    onChange={e => setFormData({...formData, activo: e.target.checked})}
                    style={{ width: 'auto', marginBottom: 0 }}
                  />
                  Técnico Activo (Disponible)
                </label>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 className="spinner" size={20} /> : <CheckCircle2 size={20} />}
                {saving ? 'Guardando...' : (editingId ? 'Actualizar Datos' : 'Registrar Técnico')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <Loader2 className="spinner" size={40} />
          <p>Cargando información del personal...</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {tecnicos.length === 0 ? (
            <div className={styles.emptyState}>No hay técnicos registrados aún.</div>
          ) : (
            tecnicos.map(t => {
              const workload = getWorkload(t.nombre);
              return (
                <div key={t.id} className={`${styles.techCard} glass ${!t.activo ? styles.inactive : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      <HardHat size={28} />
                    </div>
                    <div className={styles.info}>
                      <h3>{t.nombre}</h3>
                      <span className={styles.badge}>{t.especialidad}</span>
                    </div>
                    {(role === 'admin' || role === 'supervisor') && (
                      <div className={styles.actions}>
                        <button onClick={() => toggleStatus(t.id, t.activo)} title={t.activo ? 'Desactivar' : 'Activar'}>
                          {t.activo ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#94a3b8" />}
                        </button>
                        <button onClick={() => handleEdit(t)} title="Editar">
                          <Edit size={18} color="#3b82f6" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.contactInfo}>
                    {t.telefono && <div><Phone size={14} /> {t.telefono}</div>}
                    {t.email && <div><Mail size={14} /> {t.email}</div>}
                  </div>

                  <div className={styles.workloadStats}>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>OTs Asignadas</span>
                      <span className={styles.statValue}>{workload.total}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Pendientes</span>
                      <span className={`${styles.statValue} ${workload.pending > 0 ? styles.pendingHighlight : ''}`}>
                        {workload.pending}
                      </span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Válvulas (Equipos)</span>
                      <span className={styles.statValue}>{workload.valves}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
