'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  User, ShieldCheck, Mail, Calendar, AlertCircle, 
  Save, Loader2, ArrowLeft, Trash2, Plus, X, Check, Building2
} from 'lucide-react';
import styles from './usuarios.module.css';
import Link from 'next/link';

interface Empresa {
  id: string;
  nombre: string;
  activa: boolean;
}

export default function UsuariosPage() {
  const { role, user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // UI States
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'tecnico' as any,
    empresa_id: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role === 'admin') {
      fetchProfiles();
      fetchEmpresas();
    }
  }, [role]);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, empresas(id, nombre)')
      .order('created_at', { ascending: false });

    if (data) setProfiles(data);
    setLoading(false);
  }

  async function fetchEmpresas() {
    const { data } = await supabase
      .from('empresas')
      .select('id, nombre, activa')
      .eq('activa', true)
      .order('nombre');
    if (data) setEmpresas(data);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc('admin_create_user', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_role: newUser.role,
        p_full_name: newUser.full_name
      });

      if (error) throw error;

      // Si se seleccionó empresa, asignarla al nuevo usuario
      if (newUser.empresa_id && data) {
        await supabase
          .from('profiles')
          .update({ empresa_id: newUser.empresa_id })
          .eq('id', data);
      }

      alert('Usuario creado exitosamente.');
      setIsAddingMode(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'tecnico', empresa_id: '' });
      fetchProfiles();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function updateProfile(userId: string, updates: any) {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      alert('Error updating: ' + error.message);
    } else {
      await fetchProfiles();
    }
    setUpdatingId(null);
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (userId === currentUser?.id) return alert('No puedes eliminarte a ti mismo.');
    
    const confirm = window.confirm(`¿Estás seguro de eliminar permanentemente a ${email}? Esta acción no se puede deshacer.`);
    if (!confirm) return;

    setUpdatingId(userId);
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;
      
      setProfiles(profiles.filter(p => p.id !== userId));
      alert('Usuario eliminado correctamente.');
    } catch (err: any) {
      alert('Error eliminando usuario: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (role !== 'admin') {
    return (
      <div className={styles.denied}>
        <AlertCircle size={48} color="#ef4444" />
        <h1>Acceso Denegado</h1>
        <p>Solo los administradores pueden gestionar usuarios y roles.</p>
        <Link href="/" className="btn-primary">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={() => (window.location.href = '/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}>
              <ArrowLeft size={18} /> Volver al Dashboard
            </button>
            <h1>Usuarios y Control de Acceso</h1>
          </div>
          <p>Administración centralizada de personal y permisos</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setIsAddingMode(!isAddingMode)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAddingMode ? <X size={20} /> : <Plus size={20} />}
          {isAddingMode ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </header>

      {isAddingMode && (
        <div className={`${styles.addCard} glass`}>
          <h3>Registrar Nuevo Miembro</h3>
          <form onSubmit={handleCreateUser} className={styles.addForm}>
            <div className={styles.formGroup}>
              <label>Nombre Completo</label>
              <input 
                type="text" 
                required 
                value={newUser.full_name}
                onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                placeholder="tecnico@empresa.com"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Contraseña Temporal</label>
              <input 
                type="password" 
                required 
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                placeholder="Min. 6 caracteres"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Asignar Rol Inicial</label>
              <select 
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value as any})}
              >
                <option value="tecnico">Técnico</option>
                <option value="supervisor">Supervisor</option>
                <option value="cliente">Cliente (Lectura)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Empresa</label>
              <select
                value={newUser.empresa_id}
                onChange={e => setNewUser({...newUser, empresa_id: e.target.value})}
              >
                <option value="">— Sin empresa asignada —</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={creating} style={{ alignSelf: 'flex-end' }}>
              {creating ? <Loader2 className="spinner" size={20} /> : <Check size={20} />}
              {creating ? 'Creando...' : 'Confirmar Registro'}
            </button>
          </form>
        </div>
      )}

      <div className={styles.grid}>
        <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Empresa</th>
                <th>Registro</th>
                <th>Acceso (Rol)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>Cargando perfiles...</td></tr>
              ) : profiles.map(p => (
                <tr key={p.id} className={p.id === currentUser?.id ? styles.currentUserRow : ''}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        <User size={20} />
                      </div>
                      <div className={styles.userDetails}>
                        <input 
                          type="text"
                          defaultValue={p.full_name}
                          onBlur={(e) => {
                            if (e.target.value !== p.full_name) {
                              updateProfile(p.id, { full_name: e.target.value });
                            }
                          }}
                          className={styles.nameInput}
                          placeholder="Sin nombre"
                        />
                        <span>{p.id.slice(-8)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Columna Empresa */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                      <select
                        value={p.empresa_id || ''}
                        onChange={(e) => updateProfile(p.id, { empresa_id: e.target.value || null })}
                        disabled={updatingId === p.id}
                        style={{
                          border: '1px solid var(--glass-border)',
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-primary)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          maxWidth: '160px',
                        }}
                      >
                        <option value="">— Sin empresa —</option>
                        {empresas.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                      </select>
                      {updatingId === p.id && <Loader2 className="spinner" size={14} />}
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                      <Calendar size={14} />
                      {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className={styles.roleWrapper}>
                      <ShieldCheck size={16} className={styles[`icon_${p.role}`]} />
                      <select 
                        value={p.role} 
                        onChange={(e) => updateProfile(p.id, { role: e.target.value })}
                        disabled={updatingId === p.id || p.id === currentUser?.id}
                        className={styles[`select_${p.role}`]}
                      >
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="tecnico">Técnico</option>
                        <option value="cliente">Cliente</option>
                      </select>
                      {updatingId === p.id && <Loader2 className="spinner" size={14} />}
                    </div>
                  </td>
                  <td>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteUser(p.id, p.full_name || 'este usuario')}
                      disabled={p.id === currentUser?.id || updatingId === p.id}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.infoAside}>
          <div className="card glass" style={{ padding: '1.5rem' }}>
            <h3>Niveles de Seguridad</h3>
            <ul className={styles.roleGuide}>
              <li>
                <strong className={styles.admin}>ADMINISTADOR:</strong> 
                Acceso a CRUD de usuarios, borrado de activos e inventario.
              </li>
              <li>
                <strong className={styles.supervisor}>SUPERVISOR:</strong> 
                Edición de datos técnicos, aprobación de pruebas y firma de reportes.
              </li>
              <li>
                <strong className={styles.tecnico}>TÉCNICO:</strong> 
                Registro de datos en campo, fotos de evidencias y stock de repuestos.
              </li>
              <li>
                <strong className={styles.cliente}>CLIENTE:</strong> 
                Visualización de tableros y descarga de certificados PDF.
              </li>
            </ul>
          </div>

          {/* Info de empresas */}
          <div className="card glass" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Building2 size={18} /> Empresas Activas
            </h3>
            {empresas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No hay empresas registradas. <Link href="/empresas" style={{ color: 'var(--accent-purple)' }}>Crear empresa →</Link>
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {empresas.map(emp => (
                  <li key={emp.id} style={{ fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{emp.nombre}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {profiles.filter(p => p.empresa_id === emp.id).length} usuarios
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/empresas" style={{ display: 'block', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--accent-purple)', textDecoration: 'none' }}>
              Gestionar empresas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
