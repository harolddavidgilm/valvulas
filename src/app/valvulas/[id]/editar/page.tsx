import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import styles from '../../nueva/nueva.module.css'; // Reutilizar estilos de registro

export default async function EditarValvulaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Obtener la válvula para precargar
  const { data: valvula } = await supabase.from('valvulas').select('*').eq('id', id).single();
  
  if (!valvula) return <div>No encontrada</div>;

  async function updateValve(formData: FormData) {
    'use server';
    const data = {
      tag: formData.get('tag') as string,
      tipo: formData.get('tipo') as string,
      fluido_servicio: formData.get('fluido_servicio') as string,
      ubicacion: formData.get('ubicacion') as string,
      serial: formData.get('serial') as string,
      ano_fabricacion: formData.get('ano_fabricacion') ? parseInt(formData.get('ano_fabricacion') as string) : null,
      presion_set: parseFloat(formData.get('presion_set') as string),
      presion_operacion: formData.get('presion_operacion') ? parseFloat(formData.get('presion_operacion') as string) : null,
      normativa: formData.get('normativa') as string,
      mawp: formData.get('mawp') ? parseFloat(formData.get('mawp') as string) : null,
      estado: formData.get('estado') as string,
    };

    const { error } = await supabase.from('valvulas').update(data).eq('id', id);

    if (!error) {
      revalidatePath(`/valvulas`);
      revalidatePath(`/valvulas/${id}`);
      redirect(`/valvulas/${id}`);
    } else {
      console.error(error);
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h2>Editar Válvula: {valvula.tag}</h2>

      <form action={updateValve} className={`${styles.formContainer} glass`}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>TAG (Identificador)</label>
            <input name="tag" defaultValue={valvula.tag} required />
          </div>

          <div className={styles.field}>
            <label>Tipo de Válvula</label>
            <input name="tipo" list="tipo-opciones" defaultValue={valvula.tipo} required placeholder="Ej: PSV, PCV..." />
            <datalist id="tipo-opciones">
              <option value="PSV">PSV (Seguridad)</option>
              <option value="PRV">PRV (Alivio)</option>
              <option value="TRV">TRV (Alivio Térmico)</option>
              <option value="TEV">TEV (Expansión Térmica)</option>
              <option value="PCV">PCV (Control de Presión)</option>
            </datalist>
          </div>

          <div className={styles.field}>
            <label>Estado</label>
            <select name="estado" defaultValue={valvula.estado || 'OPERATIVA'} required>
              <option value="OPERATIVA">OPERATIVA</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              <option value="FUERA DE SERVICIO">FUERA DE SERVICIO</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Ubicación (Planta/Área)</label>
            <input name="ubicacion" defaultValue={valvula.ubicacion} />
          </div>

          <div className={styles.field}>
            <label>Serial</label>
            <input name="serial" defaultValue={valvula.serial} />
          </div>

          <div className={styles.field}>
            <label>Año de Fabricación</label>
            <input name="ano_fabricacion" type="number" defaultValue={valvula.ano_fabricacion} />
          </div>

          <div className={styles.field}>
            <label>Fluido de Servicio</label>
            <input name="fluido_servicio" defaultValue={valvula.fluido_servicio} required />
          </div>

          <div className={styles.field}>
            <label>Normativa Aplicable</label>
            <select name="normativa" defaultValue={valvula.normativa} required>
              <option value="ASME VIII">ASME Sección VIII</option>
              <option value="ASME I">ASME Sección I</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Presión de Operación (psi)</label>
            <input name="presion_operacion" type="number" step="0.01" defaultValue={valvula.presion_operacion} />
          </div>

          <div className={styles.field}>
            <label>Presión de Set (psi)</label>
            <input name="presion_set" type="number" step="0.01" defaultValue={valvula.presion_set} required />
          </div>

          <div className={styles.field}>
            <label>MAWP (psi)</label>
            <input name="mawp" type="number" step="0.01" defaultValue={valvula.mawp} />
          </div>
        </div>

        <div className={styles.actions} style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <a href={`/valvulas/${id}`} className="btn-secondary">Cancelar</a>
          <button type="submit" className="btn-primary">Guardar Cambios</button>
        </div>
      </form>
    </div>
  );
}
