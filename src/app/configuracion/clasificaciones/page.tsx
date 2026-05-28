'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Tags, Plus, X, Trash2, Edit2, Check, Loader2,
  AlertCircle, ChevronLeft, Palette, Package
} from 'lucide-react';
import styles from './clasificaciones.module.css';
import Link from 'next/link';

interface Clasificacion {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  created_at: string;
  asset_count?: number;
}

const COLOR_OPTIONS = [
  { label: 'Violeta', value: '#6366f1' },
  { label: 'Azul',    value: '#0ea5e9' },
  { label: 'Verde',   value: '#10b981' },
  { label: 'Naranja', value: '#f59e0b' },
  { label: 'Rojo',    value: '#ef4444' },
  { label: 'Púrpura', value: '#8b5cf6' },
  { label: 'Cyan',    value: '#06b6d4' },
  { label: 'Rosa',    value: '#ec4899' },
];

const emptyForm = { nombre: '', descripcion: '', color: '#6366f1' };

export default function ClasificacionesPage() {
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Clasificacion>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasificaciones();
  }, []);

  async function fetchClasificaciones() {
    setLoading(true);
    const { data, error } = await supabase
      .from('clasificaciones')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error fetching clasificaciones:', error);
      setLoading(false);
      return;
    }

    // Contar activos por clasificación
    const { data: valvulas } = await supabase
      .from('valvulas')
      .select('clasificacion_id');

    const countMap: Record<string, number> = {};
    valvulas?.forEach(v => {
      if (v.clasificacion_id) countMap[v.clasificacion_id] = (countMap[v.clasificacion_id] || 0) + 1;
    });

    const enriched = (data || []).map(c => ({
      ...c,
      asset_count: countMap[c.id] || 0,
    }));

    setClasificaciones(enriched);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.from('clasificaciones').insert([{
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        color: form.color,
      }]);
      if (error) throw error;
      setIsAdding(false);
      setForm(emptyForm);
      fetchClasificaciones();
    } catch (err: any) {
      alert('Error al crear clasificación: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c: Clasificacion) {
    setEditingId(c.id);
    setEditForm({ nombre: c.nombre, descripcion: c.descripcion || '', color: c.color });
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('clasificaciones')
        .update({
          nombre: (editForm.nombre || '').trim(),
          descripcion: (editForm.descripcion || '').trim() || null,
          color: editForm.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setEditingId(null);
      fetchClasificaciones();
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(c: Clasificacion) {
    if ((c.asset_count ?? 0) > 0) {
      alert(`No se puede eliminar "${c.nombre}" porque tiene ${c.asset_count} activo(s) asignado(s). Reasigna primero esos activos.`);
      return;
    }
    if (!confirm(`¿Eliminar la clasificación "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(c.id);
    try {
      const { error } = await supabase.from('clasificaciones').delete().eq('id', c.id);
      if (error) throw error;
      setClasificaciones(prev => prev.filter(x => x.id !== c.id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const totalActivos = clasificaciones.reduce((acc, c) => acc + (c.asset_count || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <Link href="/" className={styles.backLink}>
            <ChevronLeft size={18} /> Volver al Dashboard
          </Link>
          <div className={styles.titleRow}>
            <div className={styles.titleIcon}>
              <Tags size={24} />
            </div>
            <div>
              <h1>Clasificaciones de Activos</h1>
              <p>Categorías globales para organizar y filtrar equipos en toda la planta</p>
            </div>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancelar' : 'Nueva Clasificación'}
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsRibbon}>
        <div className={styles.statCard}>
          <Tags size={18} />
          <div>
            <span>Total Clasificaciones</span>
            <strong>{clasificaciones.length}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Package size={18} />
          <div>
            <span>Activos Clasificados</span>
            <strong>{totalActivos}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <AlertCircle size={18} />
          <div>
            <span>Sin Clasificar</span>
            <strong style={{ color: totalActivos === 0 ? 'var(--text-muted)' : '#f59e0b' }}>
              {clasificaciones.filter(c => c.asset_count === 0).length} categorías vacías
            </strong>
          </div>
        </div>
      </div>

      {/* Formulario de creación */}
      {isAdding && (
        <div className={`${styles.formCard} glass`}>
          <h3><Tags size={18} /> Nueva Clasificación</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Bombas, Compresores, Tanques..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción breve de la categoría"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Color identificador</label>
                <div className={styles.colorPicker}>
                  {COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.colorDot} ${form.color === opt.value ? styles.colorDotSelected : ''}`}
                      style={{ background: opt.value }}
                      onClick={() => setForm({ ...form, color: opt.value })}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-secondary" onClick={() => { setIsAdding(false); setForm(emptyForm); }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? <Loader2 className="spinner" size={18} /> : <Check size={18} />}
                {creating ? 'Guardando...' : 'Crear Clasificación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Clasificaciones */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className="spinner" size={36} />
          <p>Cargando clasificaciones...</p>
        </div>
      ) : clasificaciones.length === 0 ? (
        <div className={styles.emptyState}>
          <Tags size={48} />
          <h3>No hay clasificaciones aún</h3>
          <p>Crea la primera categoría para empezar a organizar tus activos.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {clasificaciones.map(c => (
            <div key={c.id} className={`${styles.card} glass`}>
              <div className={styles.cardHeader}>
                <div className={styles.colorBadge} style={{ background: c.color }} />
                {editingId === c.id ? (
                  <div className={styles.editFields}>
                    <input
                      className={styles.editInput}
                      value={editForm.nombre || ''}
                      onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                      placeholder="Nombre"
                    />
                    <input
                      className={styles.editInput}
                      value={editForm.descripcion || ''}
                      onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                      placeholder="Descripción"
                    />
                    <div className={styles.colorPicker}>
                      {COLOR_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`${styles.colorDot} ${editForm.color === opt.value ? styles.colorDotSelected : ''}`}
                          style={{ background: opt.value }}
                          onClick={() => setEditForm({ ...editForm, color: opt.value })}
                          title={opt.label}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.cardInfo}>
                    <h3 style={{ color: c.color }}>{c.nombre}</h3>
                    <p>{c.descripcion || <span className={styles.noDesc}>Sin descripción</span>}</p>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.assetCount}>
                  <Package size={14} />
                  {c.asset_count ?? 0} activo{c.asset_count !== 1 ? 's' : ''}
                </span>
                <div className={styles.cardActions}>
                  {editingId === c.id ? (
                    <>
                      <button
                        className={styles.saveBtn}
                        onClick={() => handleSaveEdit(c.id)}
                        disabled={savingId === c.id}
                      >
                        {savingId === c.id ? <Loader2 className="spinner" size={14} /> : <Check size={14} />}
                        Guardar
                      </button>
                      <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                        <X size={14} /> Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className={styles.editBtn} onClick={() => startEdit(c)}>
                        <Edit2 size={14} /> Editar
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        title={(c.asset_count ?? 0) > 0 ? 'Tiene activos asignados' : 'Eliminar'}
                      >
                        {deletingId === c.id ? <Loader2 className="spinner" size={14} /> : <Trash2 size={14} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
