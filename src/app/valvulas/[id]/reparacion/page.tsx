'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Hammer, CircleDollarSign, Clock, ListChecks, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import styles from './reparacion.module.css';

export default function NuevaReparacionPage({ params }: { params: any }) {
  const router = useRouter();
  const [valvula, setValvula] = useState<any>(null);
  const [repuestosDisponibles, setRepuestosDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [costo, setCosto] = useState('');
  const [tiempo, setTiempo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [selectedRepuestos, setSelectedRepuestos] = useState<any[]>([]); // {id, cantidad, nombre}

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params;
      const [vRes, rRes] = await Promise.all([
        supabase.from('valvulas').select('*').eq('id', resolvedParams.id).single(),
        supabase.from('repuestos').select('*').gt('stock', 0)
      ]);
      setValvula(vRes.data);
      setRepuestosDisponibles(rRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [params]);

  const addRepuesto = (id: string) => {
    const r = repuestosDisponibles.find(i => i.id === id);
    if (!r) return;
    if (selectedRepuestos.some(i => i.id === id)) return;
    setSelectedRepuestos([...selectedRepuestos, { id: r.id, nombre: r.nombre, cantidad: 1, stock: r.stock }]);
  };

  const removeRepuesto = (id: string) => {
    setSelectedRepuestos(selectedRepuestos.filter(i => i.id !== id));
  };

  const updateCantidad = (id: string, cant: number) => {
    setSelectedRepuestos(selectedRepuestos.map(i => i.id === id ? { ...i, cantidad: Math.min(cant, i.stock) } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Insert Reparación
      const { data: repa, error: rError } = await supabase.from('reparaciones').insert([{
        valvula_id: valvula.id,
        costo_total: parseFloat(costo) || 0,
        tiempo_intervencion: tiempo,
        descripcion_trabajo: descripcion,
        fecha_reparacion: new Date().toISOString()
      }]).select().single();

      if (rError) throw rError;

      // 2. Insert reparacion_repuestos (M:N)
      if (selectedRepuestos.length > 0) {
        const pivotData = selectedRepuestos.map(i => ({
          reparacion_id: repa.id,
          repuesto_id: i.id,
          cantidad: i.cantidad
        }));
        const { error: pError } = await supabase.from('reparacion_repuestos').insert(pivotData);
        if (pError) throw pError;

        // 3. Update stock for each spare part
        for (const item of selectedRepuestos) {
          await supabase.rpc('decrement_stock', { row_id: item.id, amount: item.cantidad });
        }
      }

      router.push(`/valvulas/${valvula.id}`);
      router.refresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!valvula) return <div>No encontrada.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}><ArrowLeft size={20} /></button>
        <div>
          <h1>Registrar Reparación Mecánica</h1>
          <p>Intervención para válvula: <strong>{valvula.tag}</strong></p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.gridMain}>
          {/* Columna Izquierda: Datos base */}
          <div className={styles.card}>
            <h3><Hammer size={18} /> Detalles del Trabajo</h3>
            <div className={styles.field}>
              <label>Descripción del Trabajo</label>
              <textarea 
                rows={4} 
                required 
                placeholder="Describa el mantenimiento correctivo o preventivo realizado..." 
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>
            
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Costo Estimado (USD)</label>
                <div className={styles.inputWithIcon}>
                  <CircleDollarSign size={16} />
                  <input type="number" step="0.01" value={costo} onChange={e => setCosto(e.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Tiempo Intervención</label>
                <div className={styles.inputWithIcon}>
                  <Clock size={16} />
                  <input type="text" placeholder="Ej: 4.5 horas" value={tiempo} onChange={e => setTiempo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Selección de Repuestos */}
          <div className={styles.card}>
            <h3><ListChecks size={18} /> Repuestos Consumidos</h3>
            
            <div className={styles.selector}>
              <select onChange={(e) => { if(e.target.value) addRepuesto(e.target.value); e.target.value = ''; }}>
                <option value="">Seleccione un repuesto para agregar...</option>
                {repuestosDisponibles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre} (Stock: {r.stock})</option>
                ))}
              </select>
            </div>

            <div className={styles.selectedList}>
              {selectedRepuestos.length === 0 ? (
                <div className={styles.empty}>No se han agregado repuestos aún.</div>
              ) : selectedRepuestos.map(item => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemName}>
                    <strong>{item.nombre}</strong>
                    <small>Disponible: {item.stock}</small>
                  </div>
                  <div className={styles.itemActions}>
                    <input 
                      type="number" 
                      min="1" 
                      max={item.stock}
                      value={item.cantidad} 
                      onChange={(e) => updateCantidad(item.id, parseInt(e.target.value))} 
                    />
                    <button type="button" onClick={() => removeRepuesto(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footerActions}>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <><Loader2 className="spinner" size={20} /> Guardando...</> : <><Save size={20} /> Finalizar y Guardar Historial</>}
          </button>
        </div>
      </form>
    </div>
  );
}
