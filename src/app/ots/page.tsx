import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './ots.module.css';

// Desactivar caché estático para asegurar datos frescos
export const revalidate = 0;

export default async function WorkOrdersPage() {
  // JOIN SQL para traer datos de la válvula junto a la OT
  const { data: ots, error } = await supabase
    .from('ordenes_trabajo')
    .select(`
      *,
      valvulas (
        tag
      )
    `)
    .order('fecha_programada', { ascending: true });

  if (error) {
    console.error('Error fetching OTs:', error);
  }

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
            </tr>
          </thead>
          <tbody>
            {!ots || ots.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
