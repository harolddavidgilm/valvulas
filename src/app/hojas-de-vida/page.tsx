import { supabase } from '@/lib/supabase';
import styles from '../valvulas/valvulas.module.css';
import Link from 'next/link';

export const revalidate = 0;

export default async function HojasDeVidaPage() {
  const { data: valvulas, error } = await supabase
    .from('valvulas')
    .select('*')
    .order('tag', { ascending: true });

  if (error) console.error(error);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Hojas de Vida y Trazabilidad (Activos)</h2>
        <p style={{ color: '#94a3b8' }}>Seleccione una válvula para ver su historial, pruebas y configuración.</p>
      </div>

      <div className="glass" style={{ marginTop: '2rem', overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>TAG</th>
              <th>Tipo</th>
              <th>Fluido</th>
              <th>Presión Set</th>
              <th>Normativa</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {valvulas?.map((v) => (
              <tr key={v.id}>
                <td className={styles.tag}>
                  {/* Aquí el TAG sí es un link a la Hoja de Vida */}
                  <Link href={`/valvulas/${v.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    {v.tag}
                  </Link>
                </td>
                <td>{v.tipo}</td>
                <td>{v.fluido_servicio}</td>
                <td>{v.presion_set} psi</td>
                <td>{v.normativa}</td>
                <td>
                  <span className={`${styles.badge} ${styles[v.estado?.toLowerCase() || 'operativa']}`}>
                    {(v.estado || 'Operativa').replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {(!valvulas || valvulas.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No hay válvulas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
