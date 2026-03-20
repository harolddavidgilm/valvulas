import { supabase } from '@/lib/supabase';
import { calculateASMETolerance } from '@/lib/valve-logic';
import styles from './details.module.css';
import Link from 'next/link';
import { Image as ImageIcon, FileText, Hammer, Wrench, Package, Clock, DollarSign, Calendar } from 'lucide-react';

import ValveDetailsHeader from '@/components/Valves/ValveDetailsHeader';

export default async function ValvulaDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const { data: v } = await supabase
    .from('valvulas')
    .select('*')
    .eq('id', id)
    .single();

  const { data: pruebas } = await supabase
    .from('pruebas_calibracion')
    .select('*')
    .eq('valvula_id', id)
    .order('fecha_prueba', { ascending: false });

  const { data: reparaciones } = await supabase
    .from('reparaciones')
    .select(`
      *,
      reparacion_repuestos (
        cantidad,
        repuestos ( nombre )
      )
    `)
    .eq('valvula_id', id)
    .order('fecha_reparacion', { ascending: false });

  if (!v) return <div>Válvula no encontrada.</div>;

  const tolerance = calculateASMETolerance(v.presion_set, v.normativa);

  return (
    <div className={styles.container}>
      <ValveDetailsHeader id={id} tag={v.tag} />


      <div className={styles.content}>
        <div className={`${styles.card} glass`}>
          <h3>Parámetros de Diseño & Activo</h3>
          <div className={styles.specs}>
            <div className={styles.spec}><span className={styles.label}>Fabricante</span><span className={styles.value}>{v.fabricante || 'N/A'}</span></div>
            <div className={styles.spec}><span className={styles.label}>Modelo</span><span className={styles.value}>{v.modelo || 'N/A'}</span></div>
            <div className={styles.spec}><span className={styles.label}>Serial</span><span className={styles.value}>{v.serial || 'N/A'}</span></div>
            <div className={styles.spec}><span className={styles.label}>Año</span><span className={styles.value}>{v.ano_fabricacion || 'N/A'}</span></div>
            <div className={styles.spec}><span className={styles.label}>Ubicación</span><span className={styles.value}>{v.ubicacion || 'N/A'}</span></div>
            <div className={styles.spec}><span className={styles.label}>Fluido</span><span className={styles.value}>{v.fluido_servicio}</span></div>
          </div>
        </div>

        <div className={`${styles.card} glass`}>
          <h3>Configuración de Calibración</h3>
          <div className={styles.specs}>
            <div className={styles.spec}><span className={styles.label}>Normativa</span><span className={styles.value}>{v.normativa}</span></div>
            <div className={styles.spec}><span className={styles.label}>Presión Set</span><span className={styles.value}>{v.presion_set} psi</span></div>
            <div className={styles.spec}><span className={styles.label}>Tolerancia</span><span className={styles.value} style={{ color: 'var(--accent)' }}>{tolerance.min} - {tolerance.max} psi</span></div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE PRUEBAS */}
      <div className={`${styles.card} glass`} style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Wrench size={20} color="#0ea5e9" /> Historial de Pruebas de Calibración</h3>
        {pruebas && pruebas.length > 0 ? (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>P. Promedio</th>
                  <th>Error %</th>
                  <th>Resultado</th>
                  <th>Evidencias</th>
                </tr>
              </thead>
              <tbody>
                {pruebas.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.fecha_prueba).toLocaleDateString()}</td>
                    <td>{p.tipo_prueba}</td>
                    <td>{p.presion_disparo_promedio} psi</td>
                    <td>{p.error_porcentaje?.toFixed(2)}%</td>
                    <td>
                      <span className={`${styles.statusBadge} ${p.conforme ? styles.success : styles.danger}`}>
                        {p.conforme ? 'CONFORME' : 'NO CONFORME'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.evidenceIcons}>
                        {p.foto_url && <a href={p.foto_url} target="_blank"><ImageIcon size={18} color="#0ea5e9" /></a>}
                        {p.certificado_url && <a href={p.certificado_url} target="_blank"><FileText size={18} color="#10b981" /></a>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.emptyMsg}>Sin pruebas registradas.</p>}
      </div>

      {/* HISTORIAL DE REPARACIONES */}
      <div className={`${styles.card} glass`} style={{ marginTop: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Hammer size={20} color="#f59e0b" /> Historial de Reparaciones Mecánicas</h3>
        {reparaciones && reparaciones.length > 0 ? (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajo Realizado</th>
                  <th>Tiempo</th>
                  <th>Repuestos Usados</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                {reparaciones.map(r => (
                  <tr key={r.id}>
                    <td>{new Date(r.fecha_reparacion).toLocaleDateString()}</td>
                    <td style={{ maxWidth: '300px' }}>{r.descripcion_trabajo}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {r.tiempo_intervencion}</div></td>
                    <td>
                      <div className={styles.repuestosTags}>
                        {(r.reparacion_repuestos as any[]).map((item: any, idx: number) => (
                          <span key={idx} className={styles.spareTag}>
                            {item.repuestos.nombre} (x{item.cantidad})
                          </span>
                        ))}
                        {(r.reparacion_repuestos as any[]).length === 0 && 'Ninguno'}
                      </div>
                    </td>
                    <td style={{ fontWeight: '700', color: '#1e293b' }}>${r.costo_total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.emptyMsg}>Sin reparaciones registradas.</p>}
      </div>
    </div>
  );
}
