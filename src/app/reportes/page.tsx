'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportTemplate } from '@/components/Reports/ReportTemplate';
import { FileText, Download, Calendar, Loader2, Filter, BarChart, ListChecks, CheckCircle2, AlertTriangle, TrendingUp, Table, Printer, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import HasPermission from '@/components/Auth/HasPermission';
import styles from './reportes.module.css';

export default function ReportesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('mensual');
  const [selectedValveId, setSelectedValveId] = useState('');
  const [valveSearch, setValveSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      const [vRes, pRes, rRes] = await Promise.all([
        supabase.from('valvulas').select('*'),
        supabase.from('pruebas_calibracion').select('*, valvulas(tag, modelo, fabricante)'),
        supabase.from('reparaciones').select('*, valvulas(tag, modelo, fabricante)')
      ]);

      setData({
        valvulas: vRes.data || [],
        pruebasAll: pRes.data || [],
        reparacionesAll: rRes.data || [],
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className={styles.loading}>
      <Loader2 className="spinner" size={40} />
      <p>Consultando historial de activos...</p>
    </div>
  );

  // Filtrado de datos según el tipo seleccionado
  let filteredPruebas = data.pruebasAll;
  let filteredReparaciones = data.reparacionesAll;
  let currentValve: any = null;

  if (selectedType === 'hoja-vida' && selectedValveId) {
    currentValve = data.valvulas.find((v: any) => v.id === selectedValveId);
    filteredPruebas = data.pruebasAll.filter((p: any) => p.valvula_id === selectedValveId);
    filteredReparaciones = data.reparacionesAll.filter((r: any) => r.valvula_id === selectedValveId);
  }

  // Cálculos de KPIs para la vista previa
  const conformes = filteredPruebas.filter((p: any) => p.conforme).length;
  const cumplimiento = filteredPruebas.length > 0 ? (conformes / filteredPruebas.length) * 100 : 0;
  const costos = filteredReparaciones.reduce((acc: number, r: any) => acc + (r.costo_total || 0), 0);

  const getPeriodString = () => {
    const d = new Date();
    if (selectedType === 'hoja-vida') return `Hoja de Vida Completa - ${currentValve?.tag || 'S/N'}`;
    if (selectedType === 'semanal') return `Semana del ${d.toLocaleDateString()}`;
    if (selectedType === 'mensual') return `${d.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}`;
    return `Periodo General ${d.getFullYear()}`;
  };

  const filteredValveOptions = data.valvulas.filter((v: any) => 
    v.tag.toLowerCase().includes(valveSearch.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <button className="btn-secondary" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <ArrowLeft size={18} /> Volver al Dashboard
          </button>
          <h1>Generación de Informes Técnicos</h1>
          <p>Cumplimiento normativo ASME/API y Gestión Logística</p>
        </div>
        <div className={styles.periodSelector}>
          <div className={`${styles.typeBtn} ${selectedType === 'semanal' ? styles.active : ''}`} onClick={() => setSelectedType('semanal')}>
            <Calendar size={16} /> Semanal
          </div>
          <div className={`${styles.typeBtn} ${selectedType === 'mensual' ? styles.active : ''}`} onClick={() => setSelectedType('mensual')}>
            <BarChart size={16} /> Mensual
          </div>
          <div className={`${styles.typeBtn} ${selectedType === 'anual' ? styles.active : ''}`} onClick={() => setSelectedType('anual')}>
            <TrendingUp size={16} /> Anual
          </div>
          <div className={`${styles.typeBtn} ${selectedType === 'hoja-vida' ? styles.active : ''}`} onClick={() => setSelectedType('hoja-vida')}>
            <FileText size={16} /> Historial x Válvula
          </div>
        </div>
      </header>

      {selectedType === 'hoja-vida' && (
        <div className={styles.valvePicker}>
          <Search size={18} />
          <select value={selectedValveId} onChange={e => setSelectedValveId(e.target.value)}>
            <option value="">Seleccione una Válvula (TAG)...</option>
            {filteredValveOptions.map((v: any) => (
              <option key={v.id} value={v.id}>{v.tag} - {v.fabricante}</option>
            ))}
          </select>
        </div>
      )}

      <main className={styles.grid}>
        <div className={styles.previewSection}>
          <div className={styles.card}>
            <h3><Printer size={18} /> Resumen: {selectedType === 'hoja-vida' ? 'Historial por Válvula' : selectedType.toUpperCase()}</h3>
            
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <span className={styles.label}>Cumplimiento</span>
                <span className={styles.value}>{cumplimiento.toFixed(1)}%</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Intervenciones</span>
                <span className={styles.value}>{filteredPruebas.length + filteredReparaciones.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.label}>Costo Acumulado</span>
                <span className={styles.value}>${costos.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.interventionsList}>
              <h4>Desglose de datos para el PDF:</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>TIPO</th>
                    <th>DETALLE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPruebas.slice(0, 5).map((p: any) => (
                    <tr key={p.id}>
                      <td>{new Date(p.fecha_prueba).toLocaleDateString()}</td>
                      <td>Calibración</td>
                      <td>{p.conforme ? 'CONFORME' : 'FALLA'}</td>
                    </tr>
                  ))}
                  {filteredReparaciones.slice(0, 3).map((r: any) => (
                    <tr key={r.id}>
                      <td>{new Date(r.fecha_reparacion).toLocaleDateString()}</td>
                      <td>Reparación</td>
                      <td>Mecánica</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.downloadCard}>
            <div className={styles.iconCircle}>
              <Download size={32} />
            </div>
            <h2>Exportar PDF</h2>
            <p>
              {selectedType === 'hoja-vida' 
                ? `Se generará el historial completo para la válvula ${currentValve?.tag || ''}.` 
                : 'El reporte incluirá todos los registros del periodo seleccionado.'}
            </p>
            
            {selectedType === 'hoja-vida' && !selectedValveId ? (
              <button className={styles.downloadBtnDisabled} disabled>
                <AlertTriangle size={20} /> Seleccione una Válvula
              </button>
            ) : (
              <PDFDownloadLink 
                document={
                  <ReportTemplate 
                    type={selectedType === 'hoja-vida' ? 'Hoja de Vida' : selectedType} 
                    data={{
                      valvulas: [currentValve].filter(Boolean),
                      pruebas: filteredPruebas,
                      reparaciones: filteredReparaciones,
                      kpis: { cumplimiento, vencidas: 0, costos }
                    }} 
                    period={getPeriodString()} 
                  />
                } 
                fileName={`Informe_${selectedType}_${currentValve?.tag || 'General'}.pdf`}
                className={styles.downloadBtn}
              >
                {({ loading }) => 
                  loading ? 'Preparando...' : 'Descargar Informe PDF'
                }
              </PDFDownloadLink>
            )}

            <span className={styles.hint}>Trazabilidad completa asegurada.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
