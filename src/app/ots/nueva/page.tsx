'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './nueva.module.css';

export default function NuevaOTPage() {
  const router = useRouter();
  const [valvulas, setValvulas] = useState<{ id: string, tag: string }[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Fetch valvulas
      const { data: vData } = await supabase.from('valvulas').select('id, tag').order('tag');
      if (vData) setValvulas(vData);

      // Fetch tecnicos
      const { data: tData } = await supabase.from('tecnicos').select('*').eq('activo', true).order('nombre');
      if (tData) setTecnicos(tData);
    }
    loadData();
  }, []);

  async function createOT(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const valvulasSeleccionadas = formData.getAll('valvula_id') as string[];
      
      const dataToInsert = valvulasSeleccionadas.map((v_id, index) => ({
        num_ot: `OT-${Date.now()}-${index}`,
        valvula_id: v_id,
        tipo_mantenimiento: formData.get('tipo_trabajo') as string,
        fecha_programada: formData.get('fecha_programada') as string,
        tecnico_asignado: formData.get('tecnico_asignado') as string,
        observaciones: formData.get('notas') as string,
        estado: 'BORRADOR' 
      }));

      const { error } = await supabase.from('ordenes_trabajo').insert(dataToInsert);

      if (!error) {
        router.push('/programacion');
      } else {
        throw error;
      }
    } catch (error: any) {
      console.error('Error creating OTs:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{color: '#0f172a', marginBottom: '1rem'}}>Programar Nueva Orden de Trabajo</h2>

      <form onSubmit={createOT} className={`${styles.formContainer} glass`} style={{backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
        <div className={styles.inputs}>
          
          <div className={styles.field}>
            <label>Válvulas (TAG) - Puede seleccionar múltiples</label>
            <span style={{fontSize: '0.75rem', color: '#64748b'}}>Mantenga presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varias válvulas a la vez.</span>
            <select name="valvula_id" required multiple size={8} style={{minHeight: '150px'}}>
              {valvulas?.map(v => (
                <option key={v.id} value={v.id}>{v.tag}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Tipo de Intervención</label>
            <select name="tipo_trabajo" required>
              <option value="PRUEBA">PRUEBA</option>
              <option value="MANTENIMIENTO Y PRUEBA">MANTENIMIENTO Y PRUEBA</option>
              <option value="REPARACION">REPARACION</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Fecha Programada</label>
            <input type="date" name="fecha_programada" required />
          </div>

          <div className={styles.field}>
            <label>Técnico Asignado</label>
            <select name="tecnico_asignado" required defaultValue="">
              <option value="" disabled>Seleccione un Técnico...</option>
              {tecnicos.map(t => (
                <option key={t.id} value={t.nombre}>{t.nombre} - {t.especialidad}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Notas / Instrucciones Adicionales</label>
            <textarea name="notas" placeholder="Observaciones de seguridad o alcance..." />
          </div>

        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Generando...' : 'Generar Orden de Trabajo'}
          </button>
        </div>
      </form>
    </div>
  );
}
