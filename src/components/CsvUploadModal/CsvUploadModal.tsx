'use client';

import { useState, useRef } from 'react';
import styles from './CsvUploadModal.module.css';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CsvUploadModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDownloadTemplate = () => {
    if (window.confirm('¿Desea descargar la plantilla CSV para carga masiva de válvulas?')) {
      // Usamos punto y coma para máxima compatibilidad con Excel en LATAM
      const template = 'TAG;FABRICANTE;TIPO;FLUIDO_SERVICIO;UBICACION;SERIAL;ANO_FABRICACION;PRESION_SET;PRESION_OPERACION;NORMATIVA;MAWP;ESTADO\n' +
                       'PSV-101;CROSBY;PSV;gas;Planta Principal;SN-12345;2020;150;100;ASME VIII;200;OPERATIVA';
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_valvulas.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`¿Está seguro de subir el archivo "${file.name}" para procesamiento masivo?`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setLoading(false);
        return;
      }

      const delimiter = text.includes(';') ? ';' : ',';
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        alert('El archivo CSV está vacío o solo contiene encabezados.');
        setLoading(false);
        return;
      }

      const headers = lines[0].split(delimiter).map(h => h.trim().toUpperCase());
      const dataToInsert: any[] = [];
      const validEstados = ['OPERATIVA', 'FUERA_DE_SERVICIO', 'MANTENIMIENTO', 'BAJA'];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim());
        if (cols.length !== headers.length) continue;

        const rowData: any = {};
        headers.forEach((h, index) => {
          rowData[h] = cols[index];
        });

        const tipoValvula = (rowData['TIPO'] || 'PSV').toUpperCase();

        let estadoValvula = (rowData['ESTADO'] || 'OPERATIVA').toUpperCase().replace(/ /g, '_');
        if (!validEstados.includes(estadoValvula)) {
          estadoValvula = 'OPERATIVA'; // Fallback seguro
        }

        dataToInsert.push({
          tag: rowData['TAG'] || `VALVE-${Date.now()}-${i}`,
          fabricante: rowData['FABRICANTE'] || 'N/A',
          tipo: tipoValvula,
          fluido_servicio: rowData['FLUIDO_SERVICIO'] || 'N/A',
          ubicacion: rowData['UBICACION'] || '',
          serial: rowData['SERIAL'] || '',
          ano_fabricacion: parseInt(rowData['ANO_FABRICACION']) || null,
          presion_set: parseFloat(rowData['PRESION_SET']) || 0,
          presion_operacion: parseFloat(rowData['PRESION_OPERACION']) || null,
          normativa: rowData['NORMATIVA'] || 'ASME VIII',
          mawp: parseFloat(rowData['MAWP']) || null,
          estado: estadoValvula
        });
      }

      if (dataToInsert.length === 0) {
        alert('No se pudieron extraer datos válidos de las filas provistas.');
        setLoading(false);
        return;
      }

      // Deduplicate rows by tag (keep the last occurrence in the CSV)
      // This prevents Postgres "ON CONFLICT DO UPDATE command cannot affect row a second time" error
      // if the user's CSV contains rows with duplicate TAGs.
      const deduplicatedData = Object.values(
        dataToInsert.reduce((acc, row) => {
          acc[row.tag] = row;
          return acc;
        }, {} as Record<string, any>)
      );

      // Supabase UPSERT operation (Inserts new, Updates existing by TAG)
      const { error } = await supabase.from('valvulas').upsert(deduplicatedData, { onConflict: 'tag' });

      setLoading(false);
      if (error) {
        alert('Error al subir los datos a Supabase:\n' + error.message);
      } else {
        alert(`¡Carga masiva exitosa!\nSe integraron ${dataToInsert.length} válvulas correctamente.`);
        setIsOpen(false);
        router.refresh(); 
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-secondary">
        + Carga Masiva (CSV)
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass`}>
            <h2>Subir Válvulas por CSV</h2>
            <p>Siga estos pasos para integrar múltiples registros al mismo tiempo de manera estructurada.</p>
            
            <div className={styles.stepBox}>
              <h3>1. Descargar Plantilla Oficial</h3>
              <p>Descargue el modelo e ingrese la información correspondiente en las celdas usando Excel o Bloc de notas.</p>
              <button disabled={loading} onClick={handleDownloadTemplate} className="btn-secondary" style={{ marginTop: '0.5rem', width: '100%' }}>
                Descargar Plantilla CSV
              </button>
            </div>

            <div className={styles.stepBox} style={{ marginTop: '1rem' }}>
              <h3>2. Subir Registros Completados</h3>
              <p>Haga clic acá, seleccione el archivo completado en su computador, y confirme la migración al Sistema.</p>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={processCsvFile}
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-primary" 
                style={{ marginTop: '0.5rem', width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Procesando archivo e insertando en DB...' : 'Seleccionar Archivo y Subir'}
              </button>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button disabled={loading} onClick={() => setIsOpen(false)} className="btn-secondary" style={{ border: 'none', color: '#475569' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
