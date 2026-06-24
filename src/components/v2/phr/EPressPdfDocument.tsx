import React from 'react'
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'

// ─── Shared colour constants ──────────────────────────────────────────────────
const TEAL = '#10a8a1'
const BORDER = '#d1d5db'
const TEXT = '#1e293b'
const TEXT_MUTED = '#64748b'
const WHITE = '#ffffff'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: TEAL,
    paddingBottom: 10,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEAL,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: TEXT_MUTED,
  },
  value: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 2,
  },
  rxHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: TEAL,
  },
  prescriptionItem: {
    marginBottom: 12,
    paddingLeft: 20,
  },
  medicineName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginLeft: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: TEXT,
    textAlign: 'center',
    paddingTop: 5,
    marginTop: 40,
  }
})

export interface EPressPdfProps {
  patient: {
    firstName: string | null
    lastName: string | null
    middleName: string | null
    age?: number | null
    gender: string | null
  }
  clinic: {
    name: string
    accreditationNumber: string
    address: string
  }
  prescriptions: Array<{
    genericName: string
    brandName: string
    dosage: string
    frequency: string
    duration: string
    quantity: string
  }>
  date: Date
}

export const EPressPdfDocument = ({ patient, clinic, prescriptions, date }: EPressPdfProps) => {
  const patientName = `${patient.firstName || ''} ${patient.middleName || ''} ${patient.lastName || ''}`.trim()
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>ELECTRONIC PRESCRIPTION SLIP (ePresS)</Text>
            <Text style={styles.subtitle}>{clinic.name}</Text>
            <Text style={styles.subtitle}>{clinic.address}</Text>
            <Text style={styles.subtitle}>PhilHealth Accreditation No: {clinic.accreditationNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Patient Name:</Text>
            <Text style={styles.value}>{patientName}</Text>
            <Text style={{ width: 40, marginLeft: 10, fontWeight: 'bold', color: TEXT_MUTED }}>Age:</Text>
            <Text style={{ width: 40, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 2 }}>{patient.age || ''}</Text>
            <Text style={{ width: 50, marginLeft: 10, fontWeight: 'bold', color: TEXT_MUTED }}>Gender:</Text>
            <Text style={{ width: 60, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 2 }}>{patient.gender || ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{date.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.rxHeader}>Rx</Text>
          {prescriptions.length === 0 ? (
            <Text style={{ fontStyle: 'italic', color: TEXT_MUTED }}>No medicines prescribed.</Text>
          ) : (
            prescriptions.map((rx, idx) => (
              <View key={idx} style={styles.prescriptionItem}>
                <Text style={styles.medicineName}>
                  {rx.genericName} {rx.brandName ? `(${rx.brandName})` : ''} {rx.dosage}
                </Text>
                <Text style={styles.medicineDetails}>
                  Sig: {rx.frequency} for {rx.duration}
                </Text>
                <Text style={styles.medicineDetails}>
                  Quantity: {rx.quantity}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ ...styles.section, alignItems: 'flex-end', marginTop: 40 }}>
          <View style={styles.signatureBox}>
            <Text>Signature over Printed Name</Text>
            <Text>Attending Physician</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated by ClinicEZ</Text>
          <Text>Confidential Document</Text>
        </View>
      </Page>
    </Document>
  )
}
