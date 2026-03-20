'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Plus, Search, Trash2, Edit2, AlertTriangle, ShieldCheck, Clock, CircleDollarSign, ListFilter } from 'lucide-react';
import styles from './inventario.module.css';
import HasPermission from '@/components/Auth/HasPermission';

export default function InventarioPage() {
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Empaque',
    stock: 0,
    unidad: 'pza',
    fabricante: '', 
    precio_unitario: 0,
    tiempo_entrega: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rData } = await supabase.from('repuestos').select('*').order('nombre');
    if (rData) setRepuestos(rData);

    const { data: vData } = await supabase.from('valvulas').select('fabricante');
    if (vData) {
      const unique = Array.from(new Set(vData.map(v => v.fabricante).filter(Boolean)));
      setFabricantes(unique.sort());
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await supabase.from('repuestos').update(formData).eq('id', editingItem.id);
    } else {
      await supabase.from('repuestos').insert([formData]);
    }
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar repuesto?')) {
      await supabase.from('repuestos').delete().eq('id', id);
      fetchData();
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      tipo: item.tipo,
      stock: item.stock,
      unidad: item.unidad || 'pza',
      fabricante: item.fabricante || '',
      precio_unitario: item.precio_unitario || 0,
      tiempo_entrega: item.tiempo_entrega || ''
    });
    setIsModalOpen(true);
  };

  const filtered = repuestos.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.fabricante?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Gestión de Repuestos y Marcas</h1>
          <p>Control logístico de piezas por fabricante de válvula</p>
        </div>
        <HasPermission roles={['admin', 'supervisor', 'tecnico']}>
          <button className="btn-primary" onClick={() => { setEditingItem(null); setFormData({ nombre:'', tipo:'Empaque', stock:0, unidad:'pza', fabricante:'', precio_unitario:0, tiempo_entrega:'' }); setIsModalOpen(true); }}>
            <Plus size={20} /> Nuevo Repuesto
          </button>
        </HasPermission>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span>Total</span>
          <strong>{repuestos.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Marcas</span>
          <strong style={{ color: '#0ea5e9' }}>{fabricantes.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Stock Bajo</span>
          <strong style={{ color: '#ef4444' }}>{repuestos.filter(r => r.stock < 5).length}</strong>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={20} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o marca..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Repuesto / Tipo</th>
              <th>Marca</th>
              <th>Stock</th>
              <th>Costo</th>
              <th>Tiempo Entrega</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando inventario...</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <strong>{r.nombre}</strong><br/>
                  <small style={{ color: '#94a3b8' }}>{r.tipo}</small>
                </td>
                <td><span className={styles.badge}>{r.fabricante || 'Universal'}</span></td>
                <td>
                  <span className={r.stock < 5 ? styles.lowStock : ''} style={{ fontWeight: '700' }}>
                    {r.stock} {r.unidad}
                    {r.stock < 5 && <AlertTriangle size={14} style={{ marginLeft: 6 }} />}
                  </span>
                </td>
                <td>${r.precio_unitario?.toFixed(2)}</td>
                <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} color="#64748b" /> {r.tiempo_entrega || '---'}</div></td>
                <td className={styles.actions}>
                  <HasPermission roles={['admin', 'supervisor']}>
                    <button onClick={() => openEdit(r)}><Edit2 size={16} /></button>
                  </HasPermission>
                  <HasPermission roles={['admin']}>
                    <button onClick={() => handleDelete(r.id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </HasPermission>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <h3>{editingItem ? 'Editar' : 'Agregar'} Repuesto Técnico</h3>
            <form onSubmit={handleSave}>
              <div className={styles.field}>
                <label>Nombre del Repuesto</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Resorte Inconel X-750" />
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Tipo de Pieza</label>
                  <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                    <option value="Resorte">Resorte</option>
                    <option value="Asiento">Asiento</option>
                    <option value="Disco">Disco</option>
                    <option value="Fuelle">Fuelle</option>
                    <option value="Empaque">Empaque / Junta</option>
                    <option value="Tornillería">Tornillería</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Marca (Fabricante)</label>
                  <select required value={formData.fabricante} onChange={e => setFormData({...formData, fabricante: e.target.value})}>
                    <option value="">Seleccione marca...</option>
                    <option value="Universal">Universal</option>
                    {fabricantes.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.grid} style={{ marginTop: '1rem' }}>
                <div className={styles.field}>
                  <label>Cantidad (Stock)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" style={{ width: '60%' }} value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                    <select style={{ width: '40%' }} value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})}>
                      <option value="pza">pza</option>
                      <option value="juego">juego</option>
                      <option value="kit">kit</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Precio Unitario (USD)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" step="0.01" style={{ paddingLeft: '2rem' }} value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: parseFloat(e.target.value)})} />
                    <CircleDollarSign size={16} color="#94a3b8" style={{ position: 'absolute', left: '8px', top: '12px' }} />
                  </div>
                </div>
              </div>

              <div className={styles.field} style={{ marginTop: '1rem' }}>
                <label>Tiempo de Entrega (Lead Time)</label>
                <div style={{ position: 'relative' }}>
                  <input placeholder="Ej: 3 semanas, Inmediato..." style={{ paddingLeft: '2.5rem' }} value={formData.tiempo_entrega} onChange={e => setFormData({...formData, tiempo_entrega: e.target.value})} />
                  <Clock size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Datos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
