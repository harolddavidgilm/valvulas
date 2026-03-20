'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#5c6874', // Matches sidebar-bg
    paddingBottom: 15,
  },
  logo: {
    width: 60,
    height: 60,
  },
  titleContainer: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1c2331', // Matches foreground
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 9,
    color: '#8493a5', // Matches text-muted
    marginTop: 4,
    textTransform: 'uppercase',
  },
  metaSection: {
    width: 120,
    textAlign: 'right',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#5c6874',
  },
  metaValue: {
    fontSize: 8,
    color: '#8493a5',
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    borderRadius: 12,
    backgroundColor: '#f7f9fa',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#8493a5',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4e4bb2', // Matches accent-purple for value highlights
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#5c6874', // Dark slate header
    padding: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e8ecf1',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#87bfa0', // Matches accent (mint green)
    borderBottomWidth: 2,
    borderBottomColor: '#74a78a',
  },
  tableCol: {
    flex: 1,
    padding: 6,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableCell: {
    fontSize: 8,
    color: '#1c2331',
  },
  badge: {
    fontSize: 7,
    fontWeight: 'bold',
    padding: '2 6',
    borderRadius: 4,
    textAlign: 'center',
    width: 60,
  },
  successBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  dangerBadge: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#8493a5',
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    paddingTop: 10,
  }
});

interface ReportProps {
  type: string;
  data: {
    valvulas: any[];
    pruebas: any[];
    reparaciones: any[];
    kpis: {
      cumplimiento: number;
      vencidas: number;
      costos: number;
    };
  };
  period: string;
}

export const ReportTemplate = ({ type, data, period }: ReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Image src="/logo.png" style={styles.logo} />
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>VALVEINTEGRITY</Text>
          <Text style={styles.subtitle}>Gestión de Mantenimiento de Activos Industriales</Text>
        </View>

        <View style={styles.metaSection}>
          <Text style={styles.metaLabel}>INFORME {type.toUpperCase()}</Text>
          <Text style={styles.metaValue}>{period}</Text>
          <Text style={[styles.metaValue, { fontSize: 7 }]}>Generado: {new Date().toLocaleString()}</Text>
        </View>
      </View>

      {/* KPI Section */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>CUMPLIMIENTO</Text>
          <Text style={[styles.kpiValue, { color: data.kpis.cumplimiento >= 90 ? '#10b981' : '#f59e0b' }]}>
            {data.kpis.cumplimiento.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>EQUIPOS VENCIDOS</Text>
          <Text style={[styles.kpiValue, { color: data.kpis.vencidas > 0 ? '#ef4444' : '#10b981' }]}>
            {data.kpis.vencidas}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>COSTO TOTAL (USD)</Text>
          <Text style={styles.kpiValue}>${(data.kpis.costos).toLocaleString()}</Text>
        </View>
      </View>

      {/* Main Table Section */}
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.sectionTitle}>Historial de Pruebas y Calibraciones</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCol, { flex: 0.8 }]}><Text style={styles.tableCellHeader}>FECHA</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCellHeader}>TAG VÁLVULA</Text></View>
            <View style={[styles.tableCol, { flex: 1.2 }]}><Text style={styles.tableCellHeader}>MODELO / FABRICANTE</Text></View>
            <View style={[styles.tableCol, { flex: 0.8 }]}><Text style={styles.tableCellHeader}>RESULTADO</Text></View>
          </View>
          
          {data.pruebas.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { padding: 10, textAlign: 'center', flex: 1 }]}>No se registraron pruebas en este periodo.</Text>
            </View>
          ) : data.pruebas.slice(0, 15).map((p, i) => (
            <View style={styles.tableRow} key={`p-${i}`}>
              <View style={[styles.tableCol, { flex: 0.8 }]}><Text style={styles.tableCell}>{new Date(p.fecha_prueba).toLocaleDateString()}</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{p.valvulas?.tag || 'S/N'}</Text></View>
              <View style={[styles.tableCol, { flex: 1.2 }]}><Text style={styles.tableCell}>{p.valvulas?.modelo || 'Desconocido'}</Text></View>
              <View style={[styles.tableCol, { flex: 0.8 }]}>
                <Text style={[styles.badge, p.conforme ? styles.successBadge : styles.dangerBadge]}>
                  {p.conforme ? 'CONFORME' : 'FALLA'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Repairs Table */}
      <View>
        <Text style={[styles.sectionTitle, { backgroundColor: '#4e4bb2' }]}>Resumen de Reparaciones Mecánicas</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: '#f1f5f9' }]}>
            <View style={styles.tableCol}><Text style={[styles.tableCellHeader, { color: '#475569' }]}>TAG</Text></View>
            <View style={[styles.tableCol, { flex: 2 }]}><Text style={[styles.tableCellHeader, { color: '#475569' }]}>DESCRIPCIÓN DE TRABAJO</Text></View>
            <View style={styles.tableCol}><Text style={[styles.tableCellHeader, { color: '#475569', textAlign: 'right' }]}>COSTO (USD)</Text></View>
          </View>
          
          {data.reparaciones.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { padding: 10, textAlign: 'center', flex: 1 }]}>No hay reparaciones mayores registradas.</Text>
            </View>
          ) : data.reparaciones.slice(0, 8).map((r, i) => (
            <View style={styles.tableRow} key={`r-${i}`}>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{r.valvulas?.tag}</Text></View>
              <View style={[styles.tableCol, { flex: 2 }]}><Text style={styles.tableCell}>{r.descripcion_trabajo?.substring(0, 60)}...</Text></View>
              <View style={styles.tableCol}><Text style={[styles.tableCell, { textAlign: 'right' }]}>${r.costo_total.toLocaleString()}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>VALVEINTEGRITY CMMS • Reporte de Cumplimiento Normativo • Confidencial</Text>
        <Text style={{ marginTop: 2 }}>Página 1 de 1</Text>
      </View>
    </Page>
  </Document>
);
