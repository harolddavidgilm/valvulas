'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, Plus, X, Trash2, Edit2, Check, Loader2,
  AlertCircle, ArrowLeft, Users, CheckCircle2, XCircle
} from 'lucide-react';
import styles from './empresas.module.css';
import Link from 'next/link';

interface Empresa {
  id: string;
  nombre: string;
  rif: string | null;
  direccion: string | null;
  contacto_nombre: string | null;
  contacto_email: string | null;
  activa: boolean;
  created_at: string;
  user_count?: number;
}

const emptyForm = {
  nombre: '',
  rif: '',
  direccion: '',
  contacto_nombre: '',
  contacto_email: '',
  activa: true,
};

export default function EmpresasPage() {
  const { role } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Empresa>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'admin') fetchEmpresas();
  }, [role]);

  async function fetchEmpresas() {
    setLoading(true);
    const { data: empData, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');

    if (error) {
      console.error('Error fetching empresas:', error);
      setLoading(false);
      return;
    }

    // Obtener conteo de usuarios por empresa
    const { data: profiles } = await supabase
      .from('profiles')
      .select('empresa_id');

    const countMap: Record<string, number> = {};
    profiles?.forEach(p => {
      if (p.empresa_id) countMap[p.empresa_id] = (countMap[p.empresa_id] || 0) + 1;
    });

    const enriched = (empData || []).map(e => ({
      ...e,
      user_count: countMap[e.id] || 0,
    }));

    setEmpresas(enriched);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.from('empresas').insert([{
        nombre: form.nombre.trim(),
        rif: form.rif.trim() || null,
        direccion: form.direccion.trim() || null,
        contacto_nombre: form.contacto_nombre.trim() || null,
        contacto_email: form.contacto_email.trim() || null,
        activa: form.activa,
      }]);
      if (error) throw error;
      setIsAdding(false);
      setForm(emptyForm);
      fetchEmpresas();
    } catch (err: any) {
      alert('Error al crear empresa: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(empresa: Empresa) {
    setEditingId(empresa.id);
    setEditForm({
      nombre: empresa.nombre,
      rif: empresa.rif || '',
      direccion: empresa.direccion || '',
      contacto_nombre: empresa.contacto_nombre || '',
      contacto_email: empresa.contacto_email || '',
      activa: empresa.activa,
    });
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('empresas')
        .update({
          nombre: (editForm.nombre || '').trim(),
          rif: (editForm.rif || '').trim() || null,
          direccion: (editForm.direccion || '').trim() || null,
          contacto_nombre: (editForm.contacto_nombre || '').trim() || null,
          contacto_email: (editForm.contacto_email || '').trim() || null,
          activa: editForm.activa,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      setEditingId(null);
      fetchEmpresas();
    } catch (err: any) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(empresa: Empresa) {
    if ((empresa.user_count ?? 0) > 0) {
      alert(`No se puede eliminar "${empresa.nombre}" porque tiene ${empresa.user_count} usuario(s) asignado(s). Reasigna primero a esos usuarios.`);
      return;
    }
    if (!confirm(`¿Eliminar permanentemente la empresa "${empresa.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(empresa.id);
    try {
      const { error } = await supabase.from('empresas').delete().eq('id', empresa.id);
      if (error) throw error;
      setEmpresas(prev => prev.filter(e => e.id !== empresa.id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (role !== 'admin') {
    return (
      <div className={styles.denied}>
        <AlertCircle size={48} color="#ef4444" />
        <h1>Acceso Denegado</h1>
        <p>Solo los administradores pueden gestionar empresas.</p>
        <Link href="/" className="btn-primary">Volver al Dashboard</Link>
      </div>
    );
  }

  const totalActivas = empresas.filter(e => e.activa).length;
  const totalUsuarios = empresas.reduce((acc, e) => acc + (e.user_count || 0), 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <button
            className="btn-secondary"
            onClick={() => (window.location.href = '/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', width: 'fit-content' }}
          >
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
          <h1>Gestión de Empresas</h1>
          <p>Administración centralizada de organizaciones y sus accesos</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancelar' : 'Nueva Empresa'}
        </button>
      </header>

      {/* Stats */}
      <div className={styles.statsRibbon}>
        <div className={styles.statCard}>
          <span>Total Empresas</span>
          <strong>{empresas.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Activas</span>
          <strong style={{ color: '#10b981' }}>{totalActivas}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Inactivas</span>
          <strong style={{ color: '#ef4444' }}>{empresas.length - totalActivas}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Usuarios Asignados</span>
          <strong>{totalUsuarios}</strong>
        </div>
      </div>

      {/* Create Form */}
      {isAdding && (
        <div className={`${styles.formCard} glass`}>
          <h3><Building2 size={20} /> Registrar Nueva Empresa</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Bustillo Industrial C.A."
                />
              </div>
              <div className={styles.formGroup}>
                <label>RIF / NIT</label>
                <input
                  type="text"
                  value={form.rif}
                  onChange={e => setForm({ ...form, rif: e.target.value })}
                  placeholder="J-12345678-9"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal, Caracas"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Nombre del Contacto</label>
                <input
                  type="text"
                  value={form.contacto_nombre}
                  onChange={e => setForm({ ...form, contacto_nombre: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email del Contacto</label>
                <input
                  type="email"
                  value={form.contacto_email}
                  onChange={e => setForm({ ...form, contacto_email: e.target.value })}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Estado</label>
                <select
                  value={form.activa ? 'true' : 'false'}
                  onChange={e => setForm({ ...form, activa: e.target.value === 'true' })}
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className="btn-secondary" onClick={() => { setIsAdding(false); setForm(emptyForm); }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? <Loader2 className="spinner" size={18} /> : <Check size={18} />}
                {creating ? 'Guardando...' : 'Confirmar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className={`${styles.tableCard} glass`} style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Loader2 className="spinner" size={32} style={{ margin: '0 auto 1rem' }} />
            <p>Cargando empresas...</p>
          </div>
        ) : empresas.length === 0 ? (
          <div className={styles.empty}>
            <Building2 size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No hay empresas registradas aún. Crea la primera.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>RIF / NIT</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(empresa => (
                <tr key={empresa.id}>
                  {/* Nombre */}
                  <td>
                    {editingId === empresa.id ? (
                      <input
                        className={styles.inlineInput}
                        value={editForm.nombre || ''}
                        onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                      />
                    ) : (
                      <div className={styles.companyName}>
                        <div className={styles.avatar}>
                          {empresa.nombre.charAt(0).toUpperCase()}
                        </div>
                        {empresa.nombre}
                      </div>
                    )}
                  </td>

                  {/* RIF */}
                  <td>
                    {editingId === empresa.id ? (
                      <input
                        className={styles.inlineInput}
                        value={editForm.rif || ''}
                        placeholder="J-00000000-0"
                        onChange={e => setEditForm({ ...editForm, rif: e.target.value })}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        {empresa.rif || '—'}
                      </span>
                    )}
                  </td>

                  {/* Contacto */}
                  <td>
                    {editingId === empresa.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input
                          className={styles.inlineInput}
                          value={editForm.contacto_nombre || ''}
                          placeholder="Nombre"
                          onChange={e => setEditForm({ ...editForm, contacto_nombre: e.target.value })}
                        />
                        <input
                          className={styles.inlineInput}
                          value={editForm.contacto_email || ''}
                          placeholder="Email"
                          onChange={e => setEditForm({ ...editForm, contacto_email: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.88rem' }}>
                        <div style={{ fontWeight: 600 }}>{empresa.contacto_nombre || '—'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{empresa.contacto_email || ''}</div>
                      </div>
                    )}
                  </td>

                  {/* Dirección */}
                  <td>
                    {editingId === empresa.id ? (
                      <input
                        className={styles.inlineInput}
                        value={editForm.direccion || ''}
                        placeholder="Dirección"
                        onChange={e => setEditForm({ ...editForm, direccion: e.target.value })}
                      />
                    ) : (
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {empresa.direccion || '—'}
                      </span>
                    )}
                  </td>

                  {/* Usuarios */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                      <Users size={14} style={{ opacity: 0.5 }} />
                      {empresa.user_count ?? 0}
                    </div>
                  </td>

                  {/* Estado */}
                  <td>
                    {editingId === empresa.id ? (
                      <select
                        className={styles.inlineInput}
                        value={editForm.activa ? 'true' : 'false'}
                        onChange={e => setEditForm({ ...editForm, activa: e.target.value === 'true' })}
                        style={{ minWidth: 100 }}
                      >
                        <option value="true">Activa</option>
                        <option value="false">Inactiva</option>
                      </select>
                    ) : (
                      <span className={`${styles.badge} ${empresa.activa ? styles.badgeActive : styles.badgeInactive}`}>
                        {empresa.activa ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {empresa.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td>
                    <div className={styles.actions}>
                      {editingId === empresa.id ? (
                        <>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleSaveEdit(empresa.id)}
                            disabled={savingId === empresa.id}
                            style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                          >
                            {savingId === empresa.id ? <Loader2 className="spinner" size={14} /> : <Check size={14} />}
                            Guardar
                          </button>
                          <button className={styles.editBtn} onClick={() => setEditingId(null)}>
                            <X size={14} /> Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button className={styles.editBtn} onClick={() => startEdit(empresa)}>
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(empresa)}
                            disabled={deletingId === empresa.id}
                            title={(empresa.user_count ?? 0) > 0 ? 'Tiene usuarios asignados' : 'Eliminar empresa'}
                          >
                            {deletingId === empresa.id ? <Loader2 className="spinner" size={14} /> : <Trash2 size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
