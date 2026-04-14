'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  ShieldAlert, Calendar, LayoutDashboard, TrendingDown, Clock, 
  CircleDollarSign, AlertTriangle, CheckCircle2, Factory, Filter, Loader2
} from 'lucide-react';
import styles from './page.module.css';
import RiskMatrix from '@/components/RiskMatrix/RiskMatrix';

export default function DashboardPage() {
  const [valvulas, setValvulas] = useState<any[]>([]);
  const [pruebas, setPruebas] = useState<any[]>([]);
  const [reparaciones, setReparaciones] = useState<any[]>([]);
  const [ots, setOts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlanta, setFilterPlanta] = useState('Todas');
  const lastFetchRef = useRef(0); // useRef to avoid triggering re-renders

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [vRes, pRes, rRes, oRes] = await Promise.all([
        supabase.from('valvulas').select('*'),
        supabase.from('pruebas_calibracion').select('*'),
        supabase.from('reparaciones').select('*'),
        supabase.from('ordenes_trabajo').select('*')
      ]);

      if (vRes.error) throw vRes.error;

      setValvulas(vRes.data || []);
      setPruebas(pRes.data || []);
      setReparaciones(rRes.data || []);
      setOts(oRes.data || []);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Dashboard recovery fetch error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch — runs only once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Focus revalidation — registered once, reads ref without causing loops
  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchRef.current > 5 * 60 * 1000) {
        fetchData(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Memoized Calculations
  const { 
    plantas, filteredValvulas, vencidas, cumplimiento, 
    costoTotal, mtbf, estadoData, interventionsData 
  } = useMemo(() => {
    const p = Array.from(new Set(valvulas.map(v => v.ubicacion).filter(Boolean).sort()));
    const fV = filterPlanta === 'Todas' ? valvulas : valvulas.filter(v => v.ubicacion === filterPlanta);
    const fIds = new Set(fV.map(v => v.id));
    const fP = pruebas.filter(p => fIds.has(p.valvula_id));
    const fR = reparaciones.filter(r => fIds.has(r.valvula_id));

    const hoy = new Date('2026-03-20');
    const vC = fV.filter(v => v.proxima_calibracion && new Date(v.proxima_calibracion) < hoy).length;
    const cC = fP.filter(p => p.conforme).length;
    const cP = fP.length > 0 ? (cC / fP.length) * 100 : 0;
    const cT = fR.reduce((acc, current) => acc + (current.costo_total || 0), 0);
    const m = calculateMTBF(fR);

    const eD = [
      { name: 'Operativa', value: fV.filter(v => v.estado === 'OPERATIVA' || !v.estado).length, color: '#10b981' },
      { name: 'Mant.', value: fV.filter(v => v.estado === 'MANTENIMIENTO').length, color: '#f59e0b' },
      { name: 'BAJA', value: fV.filter(v => v.estado === 'BAJA').length, color: '#ef4444' },
    ];

    const iD = [
      { name: 'Ene', pruebas: 12, reparaciones: 4 },
      { name: 'Feb', pruebas: 8, reparaciones: 2 },
      { name: 'Mar', pruebas: 15, reparaciones: 6 },
      { name: 'Abr', pruebas: 10, reparaciones: 3 },
    ];

    return {
      plantas: p,
      filteredValvulas: fV,
      vencidas: vC,
      cumplimiento: cP,
      costoTotal: cT,
      mtbf: m,
      estadoData: eD,
      interventionsData: iD
    };
  }, [valvulas, pruebas, reparaciones, filterPlanta]);

  if (loading) return (
    <div className={styles.loading}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <Loader2 className="spinner" size={48} />
        <span>Cargando Análisis de Activos...</span>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Dashboard de Integridad Operativa</h1>
          <p>Análisis en tiempo real de activos críticos</p>
        </div>
        <div className={styles.filters}>
          <Filter size={18} />
          <select value={filterPlanta} onChange={e => setFilterPlanta(e.target.value)}>
            <option value="Todas">Todos los Activos</option>
            {plantas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </header>

      {/* Ribbon de Indicadores con Semáforos */}
      <div className={styles.kpiRibbon}>
        <div className={`${styles.kpiCard} ${cumplimiento >= 90 ? styles.success : cumplimiento >= 75 ? styles.warning : styles.danger}`}>
          <div className={styles.kpiHeader}>
            <span>Cumplimiento Plan</span>
            <CheckCircle2 size={16} />
          </div>
          <div className={styles.kpiValue}>{cumplimiento.toFixed(1)}%</div>
          <div className={styles.kpiTrend}>Plan de Calibración 2026</div>
        </div>

        <div className={`${styles.kpiCard} ${vencidas === 0 ? styles.success : styles.danger}`}>
          <div className={styles.kpiHeader}>
            <span>Válvulas Vencidas</span>
            <Calendar size={16} />
          </div>
          <div className={styles.kpiValue}>{vencidas}</div>
          <div className={styles.kpiTrend}>Equipos fuera de norma</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>MTBF Promedio</span>
            <Clock size={16} />
          </div>
          <div className={styles.kpiValue}>{mtbf.toFixed(1)} <small>días</small></div>
          <div className={styles.kpiTrend}>Tiempo medio entre fallas</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Costo Mantenimiento</span>
            <CircleDollarSign size={16} />
          </div>
          <div className={styles.kpiValue}>${(costoTotal / 1000).toFixed(1)}k</div>
          <div className={styles.kpiTrend}>Acumulado anual USD</div>
        </div>
      </div>

      <main className={styles.grid}>
        {/* Gráfica de Tendencia */}
        <div className={`${styles.chartCard} glass`}>
          <h3>Tendencia de Mantenimiento e Inspección</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={interventionsData}>
                <defs>
                  <linearGradient id="colorPruebas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip />
                <Area type="monotone" dataKey="pruebas" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPruebas)" />
                <Area type="monotone" dataKey="reparaciones" stroke="#f59e0b" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Estado */}
        <div className={`${styles.chartCard} glass`}>
          <h3>Distribución de Activos por Estado</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={estadoData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matriz de Riesgo Dinámica */}
        <div className={`${styles.matrixCard} glass`}>
          <div className={styles.matrixHeader}>
            <h3>Matriz de Integridad (POF vs COF)</h3>
            <span>Riesgo Acumulado</span>
          </div>
          <RiskMatrix valvulas={filteredValvulas} />
        </div>

        {/* Listado de Fallas Recurrentes o Próximas */}
        <div className={`${styles.activeTableCard} glass`}>
          <h3>Alertas y Vencimientos</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>TAG</th>
                <th>Fabricante</th>
                <th>Próxima Calib.</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredValvulas.slice(0, 5).map(v => (
                <tr key={v.id}>
                  <td><strong>{v.tag}</strong></td>
                  <td>{v.fabricante}</td>
                  <td>{v.proxima_calibracion || 'Pte.'}</td>
                  <td>
                    <span className={`${styles.rowBadge} ${styles[v.estado?.toLowerCase() || 'operativa']}`}>
                      {v.estado || 'OPERATIVA'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function calculateMTBF(reparaciones: any[]) {
  if (reparaciones.length < 2) return 0;
  // Agrupar por válvula
  const grouped = reparaciones.reduce((acc, r) => {
    if (!acc[r.valvula_id]) acc[r.valvula_id] = [];
    acc[r.valvula_id].push(new Date(r.fecha_reparacion || r.created_at).getTime());
    return acc;
  }, {} as Record<string, number[]>);

  let totalDiff = 0;
  let intervals = 0;

  (Object.values(grouped) as number[][]).forEach((dates: number[]) => {
    if (dates.length < 2) return;
    const sorted = dates.sort((a: number, b: number) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      totalDiff += (sorted[i] - sorted[i-1]);
      intervals++;
    }
  });

  if (intervals === 0) return 0;
  return totalDiff / (1000 * 60 * 60 * 24 * intervals); // MTBF en días
}
