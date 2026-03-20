'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  periodInfo: {
    textAlign: 'right',
  },
  periodLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  dateInfo: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
  },
  table: {
    marginTop: 20,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
    alignItems: 'center',
  },
  col: {
    flex: 1,
    fontSize: 9,
    color: '#334155',
  },
  colHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  colWide: {
    flex: 1.5,
  },
  colNarrow: {
    flex: 0.7,
  },
  statusBadge: {
    fontSize: 7,
    padding: '2 6',
    borderRadius: 4,
    textAlign: 'center',
    width: 60,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

interface Props {
  data: any[];
  period: string;
  viewType: string;
}

export const SchedulePDF = ({ data, period, viewType }: Props) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Image src="/logo.png" style={styles.logo} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Programación de Intervenciones</Text>
          <Text style={styles.subtitle}>Listado de Órdenes de Trabajo Programadas</Text>
        </View>
        <View style={styles.periodInfo}>
          <Text style={styles.periodLabel}>{viewType.toUpperCase()}: {period}</Text>
          <Text style={styles.dateInfo}>Generado: {new Date().toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colHeader, styles.colNarrow]}>Fecha</Text>
          <Text style={styles.colHeader}>Válvula (TAG)</Text>
          <Text style={styles.colHeader}>Orden Trabajo</Text>
          <Text style={[styles.colHeader, styles.colWide]}>Técnico Asignado</Text>
          <Text style={styles.colHeader}>Estado</Text>
        </View>

        {data.length === 0 ? (
          <View style={styles.tableRow}>
            <Text style={[styles.col, { textAlign: 'center', flex: 1, padding: 20 }]}>
              No hay actividades programadas para este periodo.
            </Text>
          </View>
        ) : (
          data.map((ot, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.col, styles.colNarrow]}>{ot.fecha_programada}</Text>
              <Text style={[styles.col, { fontWeight: 'bold' }]}>{ot.valvulas?.tag || 'N/A'}</Text>
              <Text style={styles.col}>{ot.num_ot}</Text>
              <Text style={[styles.col, styles.colWide]}>{ot.tecnico_asignado || 'Sin asignar'}</Text>
              <Text style={styles.col}>{ot.estado || 'PROGRAMADA'}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.footer}>
        VALVEINTEGRITY CMMS • Gestión de Activos • Documento Generado Automáticamente
      </Text>
    </Page>
  </Document>
);
