'use client';

import { useState, useRef } from 'react';
import styles from './InventoryUploadModal.module.css';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FileText, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Props {
  onUploadSuccess: () => void;
}

export default function InventoryUploadModal({ onUploadSuccess }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDownloadTemplate = () => {
    if (window.confirm('¿Desea descargar la plantilla CSV para carga masiva de repuestos?')) {
      const headers = 'NOMBRE;TIPO;STOCK;UNIDAD;FABRICANTE;PRECIO_UNITARIO;TIEMPO_ENTREGA';
      const row = 'Resorte Inconel X-750;Resorte;10;pza;CROSBY;150.50;3 semanas';
      const csvContent = `${headers}\n${row}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_inventario.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`¿Está seguro de subir el archivo "${file.name}" para actualizar el inventario?`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onerror = () => {
      setLoading(false);
      alert('Error crítico al leer el archivo desde el disco.');
    };

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('El archivo parece estar vacío.');

        // Detección mejorada de delimitador
        const firstLine = text.split('\n')[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          throw new Error('El archivo CSV está vacío o solo contiene encabezados.');
        }

        const headers = lines[0].split(delimiter).map(h => h.trim().toUpperCase());
        const dataToInsert: any[] = [];

        console.log('Procesando CSV con cabeceras:', headers);

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim());
          if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;
          
          if (cols.length < headers.length) {
            console.warn(`Fila ${i} ignorada por falta de datos:`, cols);
            continue;
          }

          const rowData: any = {};
          headers.forEach((h, index) => {
            rowData[h] = cols[index];
          });

          dataToInsert.push({
            nombre: rowData['NOMBRE'] || 'Sin nombre',
            tipo: rowData['TIPO'] || 'Otro',
            stock: parseInt(rowData['STOCK']) || 0,
            unidad: rowData['UNIDAD'] || 'pza',
            fabricante: rowData['FABRICANTE'] || '',
            precio_unitario: parseFloat(rowData['PRECIO_UNITARIO']) || 0,
            tiempo_entrega: rowData['TIEMPO_ENTREGA'] || ''
          });
        }

        if (dataToInsert.length === 0) {
          throw new Error('No se pudieron extraer datos válidos del archivo. Revise el delimitador y las columnas.');
        }

        console.log('Insertando datos en Supabase:', dataToInsert);
        const { error } = await supabase.from('repuestos').insert(dataToInsert);

        if (error) {
          throw new Error('Error de base de datos: ' + error.message);
        }

        alert(`¡Carga masiva completada! Se agregaron ${dataToInsert.length} repuestos correctamente.`);
        setIsOpen(false);
        onUploadSuccess();

      } catch (err: any) {
        console.error('Error en carga masiva:', err);
        alert(err.message || 'Ocurrió un error inesperado al procesar el archivo.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={styles.triggerBtn}>
        <Upload size={18} /> Carga Masiva (CSV)
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <div className={styles.iconBox}>
                <FileText size={24} color="#0ea5e9" />
              </div>
              <div>
                <h2>Importación Masiva de Repuestos</h2>
                <p>Actualice su inventario rápidamente mediante un archivo CSV.</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.steps}>
              <div className={styles.stepItem}>
                <div className={styles.stepBadge}>1</div>
                <div className={styles.stepContent}>
                  <h4>Descargar Plantilla</h4>
                  <p>Obtenga el formato base con las columnas necesarias (Nombre, Tipo, Stock, etc.).</p>
                  <button onClick={handleDownloadTemplate} className={styles.actionBtn}>
                    <Download size={16} /> Descargar Plantilla .CSV
                  </button>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepBadge}>2</div>
                <div className={styles.stepContent}>
                  <h4>Preparar su Archivo</h4>
                  <p>Abra la plantilla en Excel, complete la información de sus repuestos y guarde los cambios.</p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepBadge}>3</div>
                <div className={styles.stepContent}>
                  <h4>Subir y Confirmar</h4>
                  <p>Seleccione el archivo guardado para procesar la carga masiva en el sistema.</p>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={processCsvFile}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className={styles.uploadBtn}
                    disabled={loading}
                  >
                    {loading ? (
                      <><AlertCircle size={18} className="spinner" /> Procesando...</>
                    ) : (
                      <><Upload size={18} /> Seleccionar y Cargar Archivo</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
