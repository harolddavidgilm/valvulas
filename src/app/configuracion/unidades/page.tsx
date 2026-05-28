'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  Factory, Plus, X, Trash2, Edit2, Check, Loader2,
  AlertCircle, ChevronLeft, Building2, Tag, Package, Search
} from 'lucide-react';
import styles from './unidades.module.css';
import Link from 'next/link';

interface Empresa {
  id: string;
  nombre: string;
}

interface UnidadSistema {
  id: string;
  nombre: string;
  tag: string | null;
  descripcion: string | null;
  empresa_id: string | null;
  created_at: string;
  empresas?: { nombre: string } | null;
  asset_count?: number;
}

const emptyForm = { nombre: '', tag: '', descripcion: '', empresa_id: '' };

export default function UnidadesPage() {
  const { role } = useAuth();
  const [unidades, setUnidades] = useState<UnidadSistema[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UnidadSistema>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUnidades();
    fetchEmpresas();
  }, []);

  async function fetchUnidades() {
    setLoading(true);
    const { data, error } = await supabase
      .from('unidades_sistema')
      .select('*, empresas(nombre)')
      .order('nombre');

    if (error) {
      console.error('Error fetching unidades:', error);
      setLoading(false);
      return;
    }

    // Contar activos por unidad
    const { data: valvulas } = await supabase
      .from('valvulas')
      .select('unidad_sistema_id');

    const countMap: Record<string, number> = {};
    valvulas?.forEach(v => {
      if (v.unidad_sistema_id) countMap[v.unidad_sistema_id] = (countMap[v.unidad_sistema_id] || 0) + 1;
    });

    const enriched = (data || []).map(u => ({
      ...u,
      asset_count: countMap[u.id] || 0,
    }));

    setUnidades(enriched);
    setLoading(false);
  }

  async function fetchEmpresas() {
    const { data } = await supabase
      .from('empresas')
      .select('id, nombre')
      .eq('activa', true)
      .order('nombre');
    if (data) setEmpresas(data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.from('unidades_sistema').insert([{
        nombre: form.nombre.trim(),
        tag: form.tag.trim() || null,
        descripcion: form.descripcion.trim() || null,
        empresa_id: form.empresa_id || null,
      }]);
      if (error) throw error;
      setIsAdding(false);
      setForm(emptyForm);
      fetchUnidades();
    } catch (err: any) {
      alert('Error al crear unidad: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(u: UnidadSistema) {
    setEditingId(u.id);
    setEditForm({
      nombre: u.nombre,
      tag: u.tag || '',
      descripcion: u.descripcion || '',
      empresa_id: u.empresa_id || '',
    });
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('unidades_sistema')
        .update({
          nombre: (editForm.nombre || '').trim(),
          tag: (editForm.tag || '').trim() || null,
          descripcion: (editForm.descripcion || '').trim() || null,
          empresa_id: (editForm.empresa_id as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setEditingId(null);
      fetchUnidades();
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(u: UnidadSistema) {
    if ((u.asset_count ?? 0) > 0) {
      alert(`No se puede eliminar "${u.nombre}" porque tiene ${u.asset_count} activo(s) asignado(s).`);
      return;
    }
    if (!confirm(`¿Eliminar la unidad "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(u.id);
    try {
      const { error } = await supabase.from('unidades_sistema').delete().eq('id', u.id);
      if (error) throw error;
      setUnidades(prev => prev.filter(x => x.id !== u.id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Filtrado local
  const filtered = unidades.filter(u => {
    const matchesEmpresa = !filterEmpresa || u.empresa_id === filterEmpresa;
    const q = search.toLowerCase();
    const matchesSearch = !q || u.nombre.toLowerCase().includes(q) || (u.tag || '').toLowerCase().includes(q);
    return matchesEmpresa && matchesSearch;
  });

  const totalActivos = unidades.reduce((acc, u) => acc + (u.asset_count || 0), 0);

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
              <Factory size={24} />
            </div>
            <div>
              <h1>Unidades / Sistemas</h1>
              <p>Áreas y unidades de proceso de la planta — vincúlalas a tus activos para organizar por área</p>
            </div>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancelar' : 'Nueva Unidad'}
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsRibbon}>
        <div className={styles.statCard}>
          <Factory size={18} />
          <div>
            <span>Total Unidades</span>
            <strong>{unidades.length}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Building2 size={18} />
          <div>
            <span>Empresas con Unidades</span>
            <strong>{new Set(unidades.map(u => u.empresa_id).filter(Boolean)).size}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <Package size={18} />
          <div>
            <span>Activos Asignados</span>
            <strong>{totalActivos}</strong>
          </div>
        </div>
      </div>

      {/* Formulario creación */}
      {isAdding && (
        <div className={`${styles.formCard} glass`}>
          <h3><Factory size={18} /> Nueva Unidad / Sistema</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre de la Unidad *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Unidad 100 - Destilación Primaria"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tag / Código</label>
                <input
                  type="text"
                  value={form.tag}
                  onChange={e => setForm({ ...form, tag: e.target.value })}
                  placeholder="Ej: U-100, SCI-001, HVAC"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Breve descripción del área o sistema"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Empresa</label>
                <select
                  value={form.empresa_id}
                  onChange={e => setForm({ ...form, empresa_id: e.target.value })}
                >
                  <option value="">— Sin empresa asignada —</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-secondary" onClick={() => { setIsAdding(false); setForm(emptyForm); }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? <Loader2 className="spinner" size={18} /> : <Check size={18} />}
                {creating ? 'Guardando...' : 'Crear Unidad'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterEmpresa}
          onChange={e => setFilterEmpresa(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Todas las empresas</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className="spinner" size={36} />
          <p>Cargando unidades...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Factory size={48} />
          <h3>{search || filterEmpresa ? 'Sin resultados' : 'No hay unidades aún'}</h3>
          <p>{search || filterEmpresa ? 'Prueba con otros filtros.' : 'Crea la primera unidad para organizar tus activos por área.'}</p>
        </div>
      ) : (
        <div className={`${styles.tableCard} glass`} style={{ padding: 0, overflow: 'hidden' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Unidad / Sistema</th>
                <th>Tag</th>
                <th>Descripción</th>
                <th>Empresa</th>
                <th>Activos</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  {/* Nombre */}
                  <td>
                    {editingId === u.id ? (
                      <input
                        className={styles.inlineInput}
                        value={editForm.nombre || ''}
                        onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                      />
                    ) : (
                      <div className={styles.unitName}>
                        <div className={styles.unitIcon}><Factory size={16} /></div>
                        {u.nombre}
                      </div>
                    )}
                  </td>

                  {/* Tag */}
                  <td>
                    {editingId === u.id ? (
                      <input
                        className={styles.inlineInput}
                        value={(editForm as any).tag || ''}
                        placeholder="Tag"
                        onChange={e => setEditForm({ ...editForm, tag: e.target.value } as any)}
                      />
                    ) : (
                      <span className={styles.tagBadge}>
                        {u.tag ? <><Tag size={12} /> {u.tag}</> : <span style={{ opacity: 0.4 }}>—</span>}
                      </span>
                    )}
                  </td>

                  {/* Descripción */}
                  <td>
                    {editingId === u.id ? (
                      <input
                        className={styles.inlineInput}
                        value={editForm.descripcion || ''}
                        placeholder="Descripción"
                        onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {u.descripcion || '—'}
                      </span>
                    )}
                  </td>

                  {/* Empresa */}
                  <td>
                    {editingId === u.id ? (
                      <select
                        className={styles.inlineInput}
                        value={(editForm as any).empresa_id || ''}
                        onChange={e => setEditForm({ ...editForm, empresa_id: e.target.value } as any)}
                      >
                        <option value="">— Sin empresa —</option>
                        {empresas.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.empresas ? <><Building2 size={13} style={{ opacity: 0.5 }} /> {u.empresas.nombre}</> : <span style={{ opacity: 0.4 }}>—</span>}
                      </span>
                    )}
                  </td>

                  {/* Activos */}
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                      <Package size={14} style={{ opacity: 0.5 }} />
                      {u.asset_count ?? 0}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className={styles.actions}>
                      {editingId === u.id ? (
                        <>
                          <button
                            className={styles.saveBtn}
                            onClick={() => handleSaveEdit(u.id)}
                            disabled={savingId === u.id}
                          >
                            {savingId === u.id ? <Loader2 className="spinner" size={14} /> : <Check size={14} />}
                            Guardar
                          </button>
                          <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>
                            <X size={14} /> Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button className={styles.editBtn} onClick={() => startEdit(u)}>
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            title={(u.asset_count ?? 0) > 0 ? 'Tiene activos asignados' : 'Eliminar unidad'}
                          >
                            {deletingId === u.id ? <Loader2 className="spinner" size={14} /> : <Trash2 size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
