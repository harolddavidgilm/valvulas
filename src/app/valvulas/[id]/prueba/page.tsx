'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { calculateASMETolerance } from '@/lib/valve-logic';
import { Camera, FileText, CloudUpload, Loader2, BarChart3, Settings2, ShieldCheck, ShieldAlert, ArrowLeft } from 'lucide-react';
import styles from './prueba.module.css';

export default function NuevaPruebaPage({ params }: { params: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ot_id = searchParams.get('ot_id');
  
  const [valvula, setValvula] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Datos Generales
  const [tipoPrueba, setTipoPrueba] = useState('Pop Test');
  const [bancoPruebas, setBancoPruebas] = useState('');

  // Datos Pop / Set Test
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [resultadoManual, setResultadoManual] = useState('OK');

  // Datos Leak Test
  const [leakPresion, setLeakPresion] = useState('');
  const [leakTiempo, setLeakTiempo] = useState('');
  const [leakFugas, setLeakFugas] = useState('');
  const [leakResultado, setLeakResultado] = useState('PASA');

  const [observaciones, setObservaciones] = useState('');

  // Archivos
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [curvaFile, setCurvaFile] = useState<File | null>(null);
  
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const curvaInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchValvula = async () => {
      const resolvedParams = await params;
      const { data } = await supabase.from('valvulas').select('*').eq('id', resolvedParams.id).single();
      setValvula(data);
      setLoading(false);
    };
    fetchValvula();
  }, [params]);

  if (loading) return <div className={styles.loading}>Cargando datos de la válvula...</div>;
  if (!valvula) return <div className={styles.error}>Válvula no encontrada.</div>;

  const getPopResults = () => {
    if (tipoPrueba === 'Leak test') return null;
    const values = [parseFloat(p1), parseFloat(p2), parseFloat(p3)].filter(v => !isNaN(v));
    if (values.length === 0) return null;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const errorAbs = avg - valvula.presion_set;
    const errorPct = (errorAbs / valvula.presion_set) * 100;
    
    const tolerance = calculateASMETolerance(valvula.presion_set, valvula.normativa);
    const isValid = avg >= tolerance.min && avg <= tolerance.max;
    
    return { avg, errorPct, isValid, tolerance };
  };

  const results = getPopResults();

  const uploadFile = async (file: File, prefix: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}_${valvula.tag}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('pruebas')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('pruebas').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let fotoUrl = null;
      let certUrl = null;
      let curvaUrl = null;

      if (fotoFile) fotoUrl = await uploadFile(fotoFile, 'foto');
      if (certFile) certUrl = await uploadFile(certFile, 'cert');
      if (curvaFile) curvaUrl = await uploadFile(curvaFile, 'curva');

      const isLeak = tipoPrueba === 'Leak test';
      
      const insertData: any = {
        valvula_id: valvula.id,
        ot_id: ot_id,
        tipo_prueba: tipoPrueba,
        banco_pruebas: bancoPruebas,
        foto_url: fotoUrl,
        certificado_url: certUrl,
        curva_url: curvaUrl,
        observaciones: observaciones
      };

      if (isLeak) {
        insertData.presion_prueba = parseFloat(leakPresion);
        insertData.tiempo_prueba = leakTiempo;
        insertData.tasa_fugas = leakFugas;
        insertData.resultado = leakResultado;
        insertData.conforme = leakResultado === 'PASA';
      } else if (results) {
        insertData.presion_disparo_1 = parseFloat(p1);
        insertData.presion_disparo_2 = parseFloat(p2) || null;
        insertData.presion_disparo_3 = parseFloat(p3) || null;
        insertData.presion_disparo_promedio = results.avg;
        insertData.error_porcentaje = results.errorPct;
        insertData.resultado = resultadoManual;
        insertData.conforme = results.isValid && resultadoManual === 'OK';
      }

      const { error } = await supabase.from('pruebas_calibracion').insert([insertData]);
      if (error) throw error;

      // Cerrar OTs pendientes
      const { data: pendingOts } = await supabase
        .from('ordenes_trabajo')
        .select('id')
        .eq('valvula_id', valvula.id)
        .neq('estado', 'EJECUTADO');

      if (pendingOts && pendingOts.length > 0) {
        const ids = pendingOts.map(o => o.id);
        await supabase.from('ordenes_trabajo').update({ 
          estado: 'EJECUTADO', 
          fecha_ejecucion: new Date().toISOString() 
        }).in('id', ids);
      }

      router.push(`/valvulas/${valvula.id}`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tolerance = calculateASMETolerance(valvula.presion_set, valvula.normativa);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className="btn-secondary" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className={styles.topHeader}>
          <h1>Registro de Pruebas Dinámico</h1>
          <p>Activo: <strong>{valvula.tag}</strong> | S/N: {valvula.serial || 'N/A'}</p>
        </div>
      </header>

      <div className={styles.infoGrid}>
        <div className={`${styles.infoCard} glass`}>
          <div className={styles.iconBox} style={{ background: '#ecfdf5' }}>
            <Settings2 size={20} color="#059669" />
          </div>
          <div>
            <span className={styles.infoLabel}>Presión de Ajuste (SET)</span>
            <span className={styles.infoValue}>{valvula.presion_set} psi</span>
          </div>
        </div>
        <div className={`${styles.infoCard} glass`}>
          <div className={styles.iconBox} style={{ background: '#f0f9ff' }}>
            <BarChart3 size={20} color="#0284c7" />
          </div>
          <div>
            <span className={styles.infoLabel}>Tolerancia Permisible</span>
            <span className={styles.infoValue}>{tolerance.min.toFixed(2)} - {tolerance.max.toFixed(2)} psi</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* SECCIÓN GENERAL */}
        <div className={`${styles.formSection} glass`}>
          <h3>Parámetros de la Prueba</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Tipo de Prueba</label>
              <select value={tipoPrueba} onChange={e => setTipoPrueba(e.target.value)}>
                <option value="Pop Test">Pop Test</option>
                <option value="Set pressure test">Set pressure test</option>
                <option value="Leak test">Leak test (Prueba de Hermeticidad)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Banco de Pruebas Usado</label>
              <input 
                type="text" 
                placeholder="Ej: Banco Hidráulico #1" 
                value={bancoPruebas} 
                onChange={e => setBancoPruebas(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN DINÁMICA: LEAK TEST O POP TEST */}
        {tipoPrueba === 'Leak test' ? (
          <div className={`${styles.formSection} glass`} style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} color="#8b5cf6" />
              <h3 style={{ margin: 0, border: 'none' }}>Datos de Hermeticidad (Leak Test)</h3>
            </div>
            
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Presión de Prueba (psi)</label>
                <input type="number" step="0.01" value={leakPresion} onChange={e => setLeakPresion(e.target.value)} required />
                <span className={styles.hint}>Valor informativo: <strong>{(valvula.presion_set * 0.9).toFixed(2)} psi</strong> (90% de SET)</span>
              </div>
              <div className={styles.field}>
                <label>Tiempo de Prueba (Seg / Min)</label>
                <input type="text" placeholder="Ej: 5 minutos" value={leakTiempo} onChange={e => setLeakTiempo(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label>Fugas detectadas (Burbujas/cc x min)</label>
                <input type="text" placeholder="Ej: 0 burbujas" value={leakFugas} onChange={e => setLeakFugas(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label>Resultado de Hermeticidad</label>
                <select value={leakResultado} onChange={e => setLeakResultado(e.target.value)}>
                  <option value="PASA">PASA (Hermética)</option>
                  <option value="NO PASA">NO PASA (Fuga detectada)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles.formSection} glass`}>
            <h3>Resultados de Disparo (Pop/Set Test)</h3>
            <div className={styles.grid3}>
              <div className={styles.field}>
                <label>P1 (psi)</label>
                <input type="number" step="0.01" value={p1} onChange={e => setP1(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label>P2 (psi)</label>
                <input type="number" step="0.01" value={p2} onChange={e => setP2(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>P3 (psi)</label>
                <input type="number" step="0.01" value={p3} onChange={e => setP3(e.target.value)} />
              </div>
            </div>

            {results && (
              <div className={`${styles.smartComparison} ${results.isValid ? styles.valid : styles.invalid}`}>
                <div className={styles.compItem}><span>Promedio</span><strong>{results.avg.toFixed(2)} psi</strong></div>
                <div className={styles.compItem}><span>Error %</span><strong>{results.errorPct.toFixed(2)}%</strong></div>
                <div className={styles.compItem}><span>Rango</span><strong>{results.isValid ? 'DENTRO' : 'FUERA'}</strong></div>
              </div>
            )}

            <div className={styles.field} style={{ marginTop: '1.5rem' }}>
              <label>Acción Realizada</label>
              <select value={resultadoManual} onChange={e => setResultadoManual(e.target.value)}>
                <option value="OK">OK (Sin cambios)</option>
                <option value="Ajuste requerido">Ajuste de Calibración</option>
              </select>
            </div>
          </div>
        )}

        {/* EVIDENCIAS */}
        <div className={`${styles.formSection} glass`}>
          <h3>Evidencias y Certificación</h3>
          <div className={styles.uploadGrid}>
            <div className={styles.uploadCard}>
              <input type="file" accept="image/*" ref={fotoInputRef} style={{ display: 'none' }} onChange={e => setFotoFile(e.target.files?.[0] || null)} />
              <div className={`${styles.uploadBox} ${fotoFile ? styles.hasFile : ''}`} onClick={() => fotoInputRef.current?.click()}>
                <Camera size={20} />
                <span>{fotoFile ? 'Foto: ' + fotoFile.name.substring(0,10)+'...' : 'Foto del Disparo'}</span>
              </div>
            </div>
            <div className={styles.uploadCard}>
              <input type="file" accept=".pdf,image/*" ref={curvaInputRef} style={{ display: 'none' }} onChange={e => setCurvaFile(e.target.files?.[0] || null)} />
              <div className={`${styles.uploadBox} ${curvaFile ? styles.hasFile : ''}`} onClick={() => curvaInputRef.current?.click()}>
                <BarChart3 size={20} />
                <span>{curvaFile ? 'Curva cargada' : 'Curvas Comportamiento'}</span>
              </div>
            </div>
            <div className={styles.uploadCard}>
              <input type="file" accept=".pdf" ref={certInputRef} style={{ display: 'none' }} onChange={e => setCertFile(e.target.files?.[0] || null)} />
              <div className={`${styles.uploadBox} ${certFile ? styles.hasFile : ''}`} onClick={() => certInputRef.current?.click()}>
                <FileText size={20} />
                <span>{certFile ? 'PDF: ' + certFile.name.substring(0,10)+'...' : 'Certificado Final'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className="btn-primary" disabled={submitting || (tipoPrueba !== 'Leak test' && !results)}>
            {submitting ? (
              <><Loader2 className="spinner" size={20} /> Guardando...</>
            ) : (
              <><CloudUpload size={20} /> Finalizar Registro</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
