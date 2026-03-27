'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp, AlertTriangle, ShieldCheck, ChevronRight,
  Search, Filter, Plus, FileText, Calendar, Activity, X, Check, Loader2
} from 'lucide-react';
import RiskMatrix from '@/components/RiskMatrix/RiskMatrix';
import styles from './rbi.module.css';
import Link from 'next/link';

export default function RBIPage() {
  const [valvulas, setValvulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedValvula, setSelectedValvula] = useState<any>(null);

  // Evaluation State
  const [evalData, setEvalData] = useState({
    pof: { edad: 1, historial: 1, condiciones: 1, fluido: 1 },
    cof: { seguridad: 1, ambiental: 1, economico: 1 },
    tipo: 'Cualitativa',
    norma: 'API 576'
  });

  // Analytics State
  const [stats, setStats] = useState({
    total: 0,
    critico: 0,
    alto: 0,
    medio: 0,
    bajo: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    console.log('RBI: Iniciando carga de válvulas...');

    // Usamos select('*') para evitar errores de columnas inexistentes mientras se propaga el esquema
    const { data, error } = await supabase
      .from('valvulas')
      .select('*');

    if (error) {
      console.error('RBI Error:', error);
      alert('Error cargando válvulas: ' + error.message);
    }

    if (data) {
      console.log('RBI: Válvulas cargadas:', data.length);
      console.table(data.slice(0, 5)); // Ver las primeras 5 en consola
      setValvulas(data);
      updateStats(data);
    } else {
      setValvulas([]);
    }
    setLoading(false);
  }

  function updateStats(data: any[]) {
    const s = { total: data.length, critico: 0, alto: 0, medio: 0, bajo: 0 };
    data.forEach(v => {
      const r = (v.nivel_riesgo || 'Bajo').toLowerCase();
      if (r === 'crítico' || r === 'critico') s.critico++;
      else if (r === 'alto') s.alto++;
      else if (r === 'medio') s.medio++;
      else s.bajo++;
    });
    setStats(s);
  }

  // Risk Calculation Logic
  const calcPOF = Math.max(evalData.pof.edad, evalData.pof.historial, evalData.pof.condiciones, evalData.pof.fluido);
  const calcCOF = Math.max(evalData.cof.seguridad, evalData.cof.ambiental, evalData.cof.economico);
  const riskValue = calcPOF * calcCOF;

  let riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' = 'Bajo';
  let interval = 48; // meses
  if (riskValue >= 20 || (calcPOF === 5 && calcCOF >= 4)) { riskLevel = 'Crítico'; interval = 12; }
  else if (riskValue >= 12 || (calcPOF >= 4 && calcCOF >= 3)) { riskLevel = 'Alto'; interval = 24; }
  else if (riskValue >= 6) { riskLevel = 'Medio'; interval = 36; }

  async function handleSubmit() {
    if (!selectedValvula) return alert('Seleccione una válvula');
    setSaving(true);

    const proximaFecha = new Date();
    proximaFecha.setMonth(proximaFecha.getMonth() + interval);

    const { error } = await supabase.from('rbi_analisis').insert({
      valvula_id: selectedValvula.id,
      tipo_evaluacion: evalData.tipo,
      norma_base: evalData.norma,
      score_pof: calcPOF,
      score_cof: calcCOF,
      riesgo_final: riskLevel,
      intervalo_sugerido: interval,
      proxima_fecha_rbi: proximaFecha.toISOString().split('T')[0],
      factores_pof: evalData.pof,
      factores_cof: evalData.cof,
      recomendaciones: [
        `Frecuencia ajustada a ${interval} meses debido a riesgo ${riskLevel}.`,
        riskLevel === 'Crítico' ? 'Realizar inspección metalográfica inmediata.' : 'Verificar estado en próxima parada.'
      ]
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowModal(false);
      fetchData();
    }
    setSaving(false);
  }

  const filteredValvulas = valvulas.filter(v =>
    v.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.servicio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1>Análisis de Inspecciones Basadas en Riesgo (RBI)</h1>
          <p>Modelado de probabilidad y consecuencia según API 580/581</p>
        </div>
        <div className={styles.actions}>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} />
            Nueva Evaluación
          </button>
        </div>
      </header>

      {/* Modal de Nueva Evaluación */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <h3>Nueva Evaluación de Riesgo</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formSection}>
                <h4>1. Equipo a Evaluar</h4>
                <select
                  className={styles.input}
                  onChange={(e) => setSelectedValvula(valvulas.find(v => v.id === e.target.value))}
                  value={selectedValvula?.id || ''}
                >
                  <option value="">{loading ? 'Cargando válvulas de Supabase...' : 'Seleccione Válvula...'}</option>
                  {!loading && valvulas.length === 0 && <option disabled>No se encontraron válvulas en la base de datos</option>}
                  {valvulas.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.tag || 'S/T'} - {v.servicio || 'Sin Servicio'}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.riskColumns}>
                <div className={styles.formSection}>
                  <h4>2. Probabilidad de Falla (POF)</h4>
                  <div className={styles.inputGroup}>
                    <label>Antigüedad / Ciclos</label>
                    <input type="range" min="1" max="5" value={evalData.pof.edad} onChange={e => setEvalData({...evalData, pof: {...evalData.pof, edad: parseInt(e.target.value)}})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Historial de Fallas</label>
                    <input type="range" min="1" max="5" value={evalData.pof.historial} onChange={e => setEvalData({...evalData, pof: {...evalData.pof, historial: parseInt(e.target.value)}})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Severidad del Fluido</label>
                    <input type="range" min="1" max="5" value={evalData.pof.fluido} onChange={e => setEvalData({...evalData, pof: {...evalData.pof, fluido: parseInt(e.target.value)}})} />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h4>3. Consecuencia de Falla (COF)</h4>
                  <div className={styles.inputGroup}>
                    <label>Seguridad y Salud (HSE)</label>
                    <input type="range" min="1" max="5" value={evalData.cof.seguridad} onChange={e => setEvalData({...evalData, cof: {...evalData.cof, seguridad: parseInt(e.target.value)}})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Impacto Ambiental</label>
                    <input type="range" min="1" max="5" value={evalData.cof.ambiental} onChange={e => setEvalData({...evalData, cof: {...evalData.cof, ambiental: parseInt(e.target.value)}})} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Pérdida Económica / Parada</label>
                    <input type="range" min="1" max="5" value={evalData.cof.economico} onChange={e => setEvalData({...evalData, cof: {...evalData.cof, economico: parseInt(e.target.value)}})} />
                  </div>
                </div>
              </div>

              <div className={styles.resultPreview}>
                <div className={styles.resCard}>
                  <span>Riesgo Calculado</span>
                  <div className={styles.riskBadge} data-risk={riskLevel.toLowerCase()}>
                    {riskLevel} ({riskValue})
                  </div>
                </div>
                <div className={styles.resCard}>
                  <span>Intervalo Sugerido</span>
                  <div className={styles.intervalVal}>{interval} Meses</div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving || !selectedValvula}>
                {saving ? <Loader2 className="spinner" size={20} /> : <Check size={20} />}
                {saving ? 'Guardando...' : 'Finalizar Análisis'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className={styles.dashboard}>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statInfo}>
              <span>Equipos Analizados</span>
              <h2>{stats.total}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.blue}`}>
              <Activity size={24} />
            </div>
          </div>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statInfo}>
              <span>Riesgo Crítico</span>
              <h2 className={styles.textCritico}>{stats.critico}</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.red}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className={`${styles.statCard} glass`}>
            <div className={styles.statInfo}>
              <span>Promedio Global</span>
              <h2>Medio</h2>
            </div>
            <div className={`${styles.statIcon} ${styles.orange}`}>
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.matrixArea}>
            <div className={styles.cardHeader}>
              <h3>Matriz de Criticidad (5x5)</h3>
              <span>Distribución de activos por riesgo</span>
            </div>
            <div className={styles.matrixContent}>
              <RiskMatrix valvulas={valvulas} />
            </div>
          </div>

          <div className={styles.listArea}>
            <div className={styles.cardHeader}>
              <h3>Ranking de Prioridad</h3>
              <div className={styles.searchBox}>
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar por TAG..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.valveList}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
                  <Loader2 className="spinner" size={40} />
                  <span>Cargando Análisis de Riesgo...</span>
                </div>
              ) : filteredValvulas.map(v => (
                <div key={v.id} className={styles.valveItem}>
                  <div className={styles.tagLabel}>
                    <strong>{v.tag}</strong>
                    <span>{v.servicio}</span>
                  </div>
                  <div className={styles.riskBadge} data-risk={(v.nivel_riesgo || 'Bajo').toLowerCase()}>
                    {v.nivel_riesgo || 'Bajo'}
                  </div>
                  <div className={styles.nextDate}>
                    <Calendar size={14} />
                    <span>{v.fecha_proximo_rbi || 'No evaluada'}</span>
                  </div>
                  <Link href={`/valvulas/${v.id}`} className={styles.viewBtn}>
                    <ChevronRight size={20} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={`${styles.recommendations} glass`}>
        <ShieldCheck size={24} color="#10b981" />
        <div className={styles.recContent}>
          <h4>Recomendación del Sistema</h4>
          <p>
            Se detectaron <strong>{stats.critico} equipos en nivel Crítico</strong>. 
            Se sugiere adelantar las inspecciones de la zona roja a un intervalo de 6 meses 
            y revisar el material del asiento por posible corrosión acelerada.
          </p>
        </div>
      </div>
    </div>
  );
}
