'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './programacion.module.css';
import Link from 'next/link';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SchedulePDF } from '@/components/SchedulePDF/SchedulePDF';
import { Download, FileDown, Loader2 } from 'lucide-react';

// Componente de cliente para el calendario dinámico
export default function ProgramacionPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ots, setOts] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Fetch OTs
      const { data: oData, error: oErr } = await supabase
        .from('ordenes_trabajo')
        .select(`
        id, 
        num_ot, 
        estado, 
        fecha_programada, 
        fecha_ejecucion,
        valvula_id,
        tecnico_asignado,
        valvulas ( tag )
      `);

      // Fetch Tecnicos
      const { data: tData } = await supabase.from('tecnicos').select('*').order('nombre');

      if (oData) setOts(oData);
      if (tData) setTecnicos(tData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Cálculos del Calendario
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Obtener en qué día empieza el mes (Ajustado para que Lunes sea 0 y Domingo 6)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const blanks = Array.from({ length: firstDayAdjusted }, (_, i) => i);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Funciones de navegación
  const prevMonth = () => {
    if (view === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const nextMonth = () => {
    if (view === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setCurrentDate(new Date());
  };

  const getOtStatusStyle = (ot: any) => {
    // 1. EJECUTADO (Verde) - Comparación insensible a mayúsculas
    const estadoStr = (ot.estado || '').toUpperCase();
    if (estadoStr === 'EJECUTADO' || estadoStr === 'CERRADA' || ot.fecha_ejecucion) {
      return styles.onTime;
    }

    const plannedStr = ot.fecha_programada;
    if (!plannedStr) return styles.projected; // Si no hay fecha, asumimos pendiente

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 2. ATRASADO (Rojo): Si la fecha programada ya pasó y NO está ejecutado
    if (plannedStr < todayStr) {
      return styles.late;
    }

    // 3. PENDIENTE (Amarillo): Programada para hoy o futuro
    return styles.projected;
  };

  // Traer las OTs filtradas por fecha y técnicos seleccionados
  const getTasksForSpecificDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    let filtered = ots.filter(ot => ot.fecha_programada === dateStr);
    if (selectedTechs.length > 0) {
      filtered = filtered.filter(ot => selectedTechs.includes(ot.tecnico_asignado));
    }
    return filtered;
  };

  const getTasksForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let filtered = ots.filter(ot => ot.fecha_programada === dateStr);
    if (selectedTechs.length > 0) {
      filtered = filtered.filter(ot => selectedTechs.includes(ot.tecnico_asignado));
    }
    return filtered;
  };

  // Lógica de KPIs (Basado en el mes visualizado y filtros)
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  let otsInMonth = ots.filter(ot => ot.fecha_programada && ot.fecha_programada.startsWith(monthPrefix));
  if (selectedTechs.length > 0) {
    otsInMonth = otsInMonth.filter(ot => selectedTechs.includes(ot.tecnico_asignado));
  }
  
  const totalMonth = otsInMonth.length;
  const completedMonth = otsInMonth.filter(ot => {
    const s = (ot.estado || '').toUpperCase();
    return s === 'EJECUTADO' || s === 'CERRADA' || ot.fecha_ejecucion;
  }).length;

  const onTimeMonth = otsInMonth.filter(ot => {
    const s = (ot.estado || '').toUpperCase();
    if (s !== 'EJECUTADO' && s !== 'CERRADA' && !ot.fecha_ejecucion) return false;
    const execStr = ot.fecha_ejecucion ? ot.fecha_ejecucion.split('T')[0] : '2999-12-31';
    return execStr <= ot.fecha_programada;
  }).length;
  
  const effectiveness = totalMonth === 0 ? 0 : Math.round((onTimeMonth / totalMonth) * 100);

  // Datos para exportar PDF según vista activa y técnicos seleccionados
  const getPdfData = () => {
    let baseData = [];
    if (view === 'month') {
      baseData = otsInMonth;
    } else if (view === 'week') {
      const d = new Date(currentDate);
      const first = d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1);
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const dd = new Date(currentDate);
        return new Date(dd.setDate(first + i)).toISOString().split('T')[0];
      });
      baseData = ots.filter(ot => ot.fecha_programada && weekDates.includes(ot.fecha_programada));
    } else {
      baseData = getTasksForSpecificDay(currentDate);
    }

    if (selectedTechs.length > 0) {
      return baseData.filter(ot => selectedTechs.includes(ot.tecnico_asignado));
    }
    return baseData;
  };

  const handleTechToggle = (techName: string) => {
    setSelectedTechs(prev => 
      prev.includes(techName) ? prev.filter(t => t !== techName) : [...prev, techName]
    );
  };

  const currentPeriodLabel = view === 'month' ? `${monthNames[currentMonth]} ${currentYear}` : 
                            view === 'week' ? `Semana ${currentDate.toLocaleDateString()}` :
                            currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Programación de Intervenciones</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>
            Planificador visual y efectividad de ejecución
          </p>
        </div>
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Programadas (Mes)</span>
          <span className={styles.kpiValue} style={{ color: '#0ea5e9'}}>{totalMonth}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Completadas</span>
          <span className={styles.kpiValue} style={{ color: '#10b981'}}>{completedMonth}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiTitle}>Efectividad de Prog.</span>
          <span className={styles.kpiValue} style={{ color: effectiveness >= 80 ? '#22c55e' : effectiveness >= 50 ? '#eab308' : '#ef4444'}}>
            {effectiveness}%
          </span>
        </div>
      </div>

      <div className={styles.calendarWrapper}>
        <div className={styles.toolbar}>
          <div className={styles.viewSelector}>
            <button 
              className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
              onClick={() => setView('month')}
            >
              Mes
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
              onClick={() => setView('week')}
            >
              Semana
            </button>
            <button 
              className={`${styles.viewBtn} ${view === 'day' ? styles.active : ''}`}
              onClick={() => setView('day')}
            >
              Día
            </button>
          </div>

          <div className={styles.monthControls}>
            <button onClick={prevMonth} className={styles.btnControl}><ChevronLeft size={20} /></button>
            <div className={styles.monthLabel}>
               {currentPeriodLabel}
            </div>
            <button onClick={nextMonth} className={styles.btnControl}><ChevronRight size={20} /></button>
          </div>
          
          <div className={styles.techFilterContainer}>
            <span className={styles.filterLabel}>Filtrar Técnico(s):</span>
            <div className={styles.techTags}>
              <button 
                className={`${styles.techTag} ${selectedTechs.length === 0 ? styles.activeTag : ''}`}
                onClick={() => setSelectedTechs([])}
              >
                Todos
              </button>
              {tecnicos.map(t => (
                <button
                  key={t.id}
                  className={`${styles.techTag} ${selectedTechs.includes(t.nombre) ? styles.activeTag : ''}`}
                  onClick={() => handleTechToggle(t.nombre)}
                >
                  {t.nombre.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!loading && (
              <PDFDownloadLink
                document={
                  <SchedulePDF 
                    data={getPdfData()} 
                    period={currentPeriodLabel}
                    viewType={view}
                  />
                }
                fileName={`Programacion_${view}_${currentPeriodLabel.replace(/ /g, '_')}.pdf`}
                className={styles.pdfBtn}
              >
                {({ loading }) => (
                  loading ? <><Loader2 size={16} className="spinner" /> Generando...</> : <><FileDown size={18} /> Exportar PDF</>
                )}
              </PDFDownloadLink>
            )}
            <button onClick={goToToday} className={styles.btnToday}>Hoy</button>
          </div>
        </div>

        <div className={styles.weekdays}>
          {daysOfWeek.map(day => (
            <div key={day} className={styles.weekday}>{day}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#64748b' }}>
            <Loader2 className="spinner" size={48} />
            <span>Sincronizando Calendario...</span>
          </div>
        ) : (
          <>
            {view === 'month' && (
              <div className={styles.daysGrid}>
                {blanks.map(blank => (
                  <div key={`blank-${blank}`} className={`${styles.dayCell} ${styles.empty}`}></div>
                ))}
                
                {calendarDays.map(day => {
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const tasks = getTasksForDay(day);

                  return (
                    <div key={day} className={styles.dayCell}>
                      <div className={`${styles.dayNumber} ${isToday ? styles.today : ''}`}>
                        {day}
                      </div>
                      
                      <div className={styles.tasksList}>
                        {tasks.slice(0, 3).map(ot => {
                          const statusClass = getOtStatusStyle(ot);
                          return (
                            <Link href={`/valvulas/${ot.valvula_id}/prueba?ot_id=${ot.id}`} key={ot.id} style={{textDecoration: 'none'}}>
                              <div 
                              className={`${styles.taskPill} ${statusClass}`}
                              title={`OT: ${ot.num_ot} | Válvula: ${ot.valvulas?.tag || 'N/A'} | Técnico: ${ot.tecnico_asignado || 'Sin asignar'}`}
                            >
                              {ot.valvulas?.tag || ot.num_ot} <small>({ot.tecnico_asignado || '---'})</small>
                            </div>
                            </Link>
                          );
                        })}
                        {tasks.length > 3 && (
                          <Link href="/ots" className={styles.seeMoreLink}>
                            Ver {tasks.length - 3} más +
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'week' && (
              <div className={styles.weekView}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(currentDate);
                  const first = d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1); // Start of week (Monday)
                  const dayDate = new Date(d.setDate(first + i));
                  const tasks = getTasksForSpecificDay(dayDate);
                  const isToday = dayDate.toDateString() === today.toDateString();

                  return (
                    <div key={i} className={styles.weekDayCol}>
                      <div className={`${styles.weekDayHeader} ${isToday ? styles.todayHeader : ''}`}>
                        <span>{daysOfWeek[i]}</span>
                        <strong>{dayDate.getDate()}</strong>
                      </div>
                      <div className={styles.weekTasks}>
                        {tasks.map(ot => (
                          <Link href={`/valvulas/${ot.valvula_id}/prueba?ot_id=${ot.id}`} key={ot.id} style={{textDecoration: 'none'}}>
                            <div className={`${styles.taskCard} ${getOtStatusStyle(ot)}`}>
                              <strong>{ot.valvulas?.tag}</strong>
                              <small>OT: {ot.num_ot}</small>
                              <div style={{ fontSize: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.05)', marginTop: '4px', paddingTop: '4px', fontWeight: 'bold' }}>
                                Téc: {ot.tecnico_asignado || 'No asignado'}
                              </div>
                            </div>
                          </Link>
                        ))}
                        {tasks.length === 0 && <div className={styles.noTasks}>No hay programadas</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'day' && (
              <div className={styles.dayView}>
                <div className={styles.dayHeader}>
                   <h3>{currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                </div>
                <div className={styles.dayTaskList}>
                  {getTasksForSpecificDay(currentDate).map(ot => (
                     <Link href={`/valvulas/${ot.valvula_id}/prueba?ot_id=${ot.id}`} key={ot.id} style={{textDecoration: 'none'}}>
                       <div className={`${styles.bigTaskCard} ${getOtStatusStyle(ot)}`}>
                         <CalendarIcon size={24} />
                         <div>
                           <strong>{ot.valvulas?.tag}</strong>
                           <p>Orden de Trabajo: {ot.num_ot} - Estado: {ot.estado}</p>
                           <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Técnico Asignado: {ot.tecnico_asignado || 'Sin asignar'}</p>
                         </div>
                       </div>
                     </Link>
                  ))}
                  {getTasksForSpecificDay(currentDate).length === 0 && (
                    <div className={styles.emptyDay}>No hay actividades programadas para hoy.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
