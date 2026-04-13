'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
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
        router.push('/ots');
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 100px)',
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '850px', padding: '2.5rem', borderRadius: '24px', backgroundColor: '#fff' }}>
        <button 
          className="btn-secondary" 
          onClick={() => router.back()} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}
        >
          <ArrowLeft size={18} /> Volver
        </button>

        <h2 style={{ marginBottom: '2rem', fontSize: '1.75rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar style={{ color: 'var(--accent-purple)' }} />
          Programar Nueva Orden de Trabajo
        </h2>

        <form onSubmit={createOT}>
          <div className={styles.gridContainer}>
            <div className={styles.field} style={{ gridColumn: 'span 2' }}>
              <label>Válvulas (TAG) - Puede seleccionar múltiples</label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Mantenga presionado Ctrl (Windows) o Cmd (Mac) para seleccionar varias válvulas a la vez.
              </p>
              <select 
                name="valvula_id" 
                required 
                multiple 
                size={6} 
                className={styles.multiSelect}
              >
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
              <textarea 
                name="notas" 
                placeholder="Observaciones de seguridad o alcance..." 
                rows={3} 
              />
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className={styles.cancelBtn}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem 2.5rem' }}
            >
              {saving ? <><Loader2 className="spinner" size={18} /> Generando...</> : <><Save size={18} /> Generar Orden de Trabajo</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
