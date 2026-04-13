'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import styles from './nueva.module.css';

export default function NuevaValvulaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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
      fabricante: formData.get('fabricante') as string,
      estado: 'OPERATIVA',
    };

    const { error: insertError } = await supabase
      .from('valvulas')
      .insert([data]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push('/valvulas');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className="btn-secondary" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h2>Registrar Nueva Válvula</h2>
      </header>

      <form onSubmit={handleSubmit} className={`${styles.form} glass`}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>TAG (Identificador)</label>
            <input name="tag" required placeholder="Ej: 10-PSV-001" />
          </div>

          <div className={styles.field}>
            <label>Tipo de Válvula</label>
            <input name="tipo" list="tipo-opciones" required placeholder="Ej: PSV, PRV, PCV..." />
            <div className={styles.fieldHint}>Ej: PSV (Seguridad), PRV (Alivio)</div>
          </div>

          <div className={styles.field}>
            <label>Fabricante (Marca)</label>
            <input name="fabricante" required placeholder="Ej: Crosby, Farris, Anderson Greenwood" />
          </div>

          <div className={styles.field}>
            <label>Ubicación (Planta/Área)</label>
            <input name="ubicacion" placeholder="Ej: Unidad de Crudo" />
          </div>

          <div className={styles.field}>
            <label>Serial</label>
            <input name="serial" placeholder="Ej: SN-45892" />
          </div>

          <div className={styles.field}>
            <label>Año de Fabricación</label>
            <input name="ano_fabricacion" type="number" placeholder="Ej: 2018" />
          </div>

          <div className={styles.field}>
            <label>Fluido de Servicio</label>
            <input name="fluido_servicio" required placeholder="Ej: Vapor, Crudo, Aire" />
          </div>

          <div className={styles.field}>
            <label>Normativa Aplicable</label>
            <select name="normativa" required>
              <option value="ASME VIII">ASME Sección VIII</option>
              <option value="ASME I">ASME Sección I</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Presión de Operación (psi)</label>
            <input name="presion_operacion" type="number" step="0.01" placeholder="Ej: 80" />
          </div>

          <div className={styles.field}>
            <label>Presión de Set (psi)</label>
            <input name="presion_set" type="number" step="0.01" required placeholder="0.00" />
          </div>

          <div className={styles.field}>
            <label>MAWP (psi)</label>
            <input name="mawp" type="number" step="0.01" placeholder="Presión Máxima" />
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.actions}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Válvula'}
          </button>
        </div>
      </form>
    </div>
  );
}
