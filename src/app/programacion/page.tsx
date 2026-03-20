'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './programacion.module.css';
import Link from 'next/link';

// Componente de cliente para el calendario dinámico
export default function ProgramacionPage() {
  const [ots, setOts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    fetchOts();
  }, []);

  const fetchOts = async () => {
    setLoading(true);
    // Extraemos la información básica de las OTs y el tag de la válvula relacionada
    const { data, error } = await supabase
      .from('ordenes_trabajo')
      .select(`
        id, 
        num_ot, 
        estado, 
        fecha_programada, 
        fecha_ejecucion,
        valvula_id,
        valvulas ( tag )
      `);

    if (data && !error) {
      setOts(data);
    }
    setLoading(false);
  };

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
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
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

  // Traer las OTs de un día en específico del mes actual
  const getTasksForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ots.filter(ot => ot.fecha_programada === dateStr);
  };

  // Lógica de KPIs (Basado en el mes visualizado)
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const otsInMonth = ots.filter(ot => ot.fecha_programada && ot.fecha_programada.startsWith(monthPrefix));
  
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
          <div className={styles.monthControls}>
            <button onClick={prevMonth} className={styles.btnControl}><ChevronLeft size={20} /></button>
            <div className={styles.monthLabel}>
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button onClick={nextMonth} className={styles.btnControl}><ChevronRight size={20} /></button>
          </div>
          <div>
            <button onClick={goToToday} className={styles.btnToday}>Hoy</button>
          </div>
        </div>

        <div className={styles.weekdays}>
          {daysOfWeek.map(day => (
            <div key={day} className={styles.weekday}>{day}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Cargando calendario...</div>
        ) : (
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
                            title={`OT: ${ot.num_ot} | Válvula: ${ot.valvulas?.tag || 'N/A'}`}
                          >
                            {ot.valvulas?.tag || ot.num_ot}
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
      </div>
    </div>
  );
}
