/**
 * PHR PDF Document
 *
 * Built with @react-pdf/renderer.
 * Mirrors the structure of PHRPrintContent.tsx but outputs a proper PDF file
 * without relying on the browser's print dialog.
 */
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { PHR_SECTIONS, type PHRSectionId, type PHRTheme } from './phr-sections'

// ─── re-export so callers can still import from here ─────────────────────────
export { PHR_SECTIONS, type PHRSectionId, type PHRTheme }

// ─── Shared colour constants ──────────────────────────────────────────────────
const TEAL = '#10a8a1'
const TEAL_DARK = '#0a7a75'
const TEAL_LIGHT = '#e6f7f7'
const BORDER = '#d1d5db'
const TEXT = '#1e293b'
const TEXT_MUTED = '#64748b'
const BG_ALT = '#f8fafc'
const WHITE = '#ffffff'

// ─── Per-theme colour palettes ────────────────────────────────────────────────
interface ThemePalette {
  headerBg: string
  headerBorder: string
  headerColor: string
  patientBarBg: string
  patientBarText: string
  patientBarBorderLeft: string
  sectionHeaderBg: string
  sectionHeaderText: string
  sectionBodyBorder: string
  tableHeadBg: string
  thColor: string
  vitalCardBg: string
  vitalCardBorder: string
  vitalValueColor: string
  footerBorder: string
  footerBrandColor: string
}

const COLORFUL: ThemePalette = {
  headerBg: TEAL,
  headerBorder: TEAL,
  headerColor: WHITE,
  patientBarBg: TEAL_DARK,
  patientBarText: WHITE,
  patientBarBorderLeft: 'rgba(255,255,255,0.3)',
  sectionHeaderBg: TEAL,
  sectionHeaderText: WHITE,
  sectionBodyBorder: TEAL,
  tableHeadBg: TEAL_LIGHT,
  thColor: TEAL_DARK,
  vitalCardBg: TEAL_LIGHT,
  vitalCardBorder: '#a7d7d5',
  vitalValueColor: TEAL_DARK,
  footerBorder: TEAL,
  footerBrandColor: TEAL_DARK,
}

const MINIMAL: ThemePalette = {
  headerBg: '#64748b',
  headerBorder: '#475569',
  headerColor: WHITE,
  patientBarBg: '#f1f5f9',
  patientBarText: '#1e293b',
  patientBarBorderLeft: '#cbd5e1',
  sectionHeaderBg: '#e2e8f0',
  sectionHeaderText: '#1e293b',
  sectionBodyBorder: '#cbd5e1',
  tableHeadBg: '#f1f5f9',
  thColor: '#475569',
  vitalCardBg: '#f8fafc',
  vitalCardBorder: '#cbd5e1',
  vitalValueColor: '#1e293b',
  footerBorder: '#94a3b8',
  footerBrandColor: '#334155',
}

// ─── StyleSheet (layout only — colours are injected inline per theme) ─────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT,
    backgroundColor: WHITE,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  logoBox: { backgroundColor: WHITE, paddingHorizontal: 8, paddingVertical: 4 },
  logoText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEAL },
  headerRight: { textAlign: 'right' },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  headerMeta: { fontSize: 7, opacity: 0.9, marginTop: 2 },
  // ── Patient bar ──
  patientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: WHITE },
  avatarImg: { width: 40, height: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: WHITE },
  patientMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 },
  patientMetaItem: { fontSize: 7, color: WHITE, opacity: 0.85 },
  statsRow: { flexDirection: 'row', gap: 12, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)', paddingLeft: 12 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WHITE },
  statLabel: { fontSize: 6, color: WHITE, opacity: 0.75, textTransform: 'uppercase' },
  // ── Sections ──
  section: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  sectionBody: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    padding: 8,
    backgroundColor: WHITE,
    borderWidth: 1,
  },
  // ── Field grid ──
  fieldGrid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldItem: { width: '31%', marginBottom: 4 },
  fieldLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 },
  fieldValue: { fontSize: 8, color: TEXT },
  // ── Table ──
  table: { width: '100%' },
  tableHead: { flexDirection: 'row' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, backgroundColor: BG_ALT },
  th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', paddingVertical: 4, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER, textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { fontSize: 7.5, color: TEXT, paddingVertical: 3, paddingHorizontal: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  // ── Vital cards ──
  vitalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  vitalCard: { borderWidth: 0.5, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', minWidth: 70 },
  vitalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  vitalLabel: { fontSize: 6, color: TEXT_MUTED, textTransform: 'uppercase', marginTop: 1 },
  // ── Badges ──
  badgePrimary: { backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: 6.5, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4, paddingVertical: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  badgeOther: { backgroundColor: '#f1f5f9', color: TEXT_MUTED, fontSize: 6.5, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4, paddingVertical: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  badgeGreen: { backgroundColor: '#dcfce7', color: '#166534', fontSize: 6.5, fontFamily: 'Helvetica-Bold', paddingHorizontal: 4, paddingVertical: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  // ── Empty ──
  empty: { fontSize: 8, color: TEXT_MUTED, fontStyle: 'italic', padding: 6 },
  // ── Sub-label ──
  subLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 5,
  },
  footerLeft: { fontSize: 6.5, color: TEXT_MUTED },
  footerBrand: { fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  confidential: {
    backgroundColor: '#fef2f2',
    borderWidth: 0.5,
    borderColor: '#fecaca',
    color: '#991b1b',
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    letterSpacing: 0.5,
  },
  footerRight: { fontSize: 6.5, color: TEXT_MUTED, textAlign: 'right' },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function cap(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function v(s: string | number | null | undefined, fallback = '—'): string {
  return (s === null || s === undefined || s === '') ? fallback : String(s)
}

function calcBmi(weight: number | null, height: number | null): string {
  if (!weight || !height) return '—'
  return (weight / ((height / 100) ** 2)).toFixed(1)
}

function fmtBloodType(bt: string | null | undefined): string {
  if (!bt) return 'N/A'
  return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SecHeader({ icon, title, tc }: { icon: string; title: string; tc: ThemePalette }) {
  return (
    <View style={[s.sectionHeader, { backgroundColor: tc.sectionHeaderBg }]}>
      <Text style={[s.sectionTitle, { color: tc.sectionHeaderText }]}>{icon} {title.toUpperCase()}</Text>
    </View>
  )
}

function Empty({ msg }: { msg: string }) {
  return <Text style={s.empty}>{msg}</Text>
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={s.fieldItem}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{v(value)}</Text>
    </View>
  )
}

// ─── Column-width helpers (must sum to 1) ────────────────────────────────────
function Th({ children, flex, tc }: { children: string; flex: number; tc: ThemePalette }) {
  return <Text style={[s.th, { flex, color: tc.thColor }]}>{children}</Text>
}
function Td({ children, flex, alt }: { children: React.ReactNode; flex: number; alt: boolean }) {
  return <Text style={[s.td, { flex }, alt ? { backgroundColor: BG_ALT } : {}]}>{children}</Text>
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ generatedAt, clinicName, showClinicName, tc }: { generatedAt: string; clinicName?: string; showClinicName?: boolean; tc: ThemePalette }) {
  return (
    <View style={[s.footer, { borderTopColor: tc.footerBorder }]} fixed>
      <View>
        <Text style={[s.footerBrand, { color: tc.footerBrandColor }]}>ClinicEZ — Personal Health Record</Text>
        <Text style={s.footerLeft}>Confidential — for the named patient or authorised healthcare provider only.</Text>
      </View>
      <Text style={s.confidential}>CONFIDENTIAL</Text>
      <View>
        <Text style={s.footerRight}>Generated: {generatedAt}</Text>
        {showClinicName && clinicName ? <Text style={s.footerRight}>Clinic: {clinicName}</Text> : null}
        <Text style={s.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </View>
  )
}

// ─── Main document ────────────────────────────────────────────────────────────
interface PHRPdfDocumentProps {
  patient: SerializedPatientHealthRecordsResponse
  sections: PHRSectionId[]
  generatedAt: string
  theme?: PHRTheme
  showClinicName?: boolean
}

export function PHRPdfDocument({ patient, sections, generatedAt, theme = 'colorful', showClinicName = false }: PHRPdfDocumentProps) {
  const sectionSet = new Set(sections)
  const has = (id: PHRSectionId) => sectionSet.has(id)
  const tc = theme === 'minimal' ? MINIMAL : COLORFUL

  const lv = patient.latestVitals
  const displayBMI = lv?.bmi ?? (lv ? calcBmi(lv.weight, lv.height) : null)
  const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <Document title={`PHR — ${patient.fullName}`} author="ClinicEZ" creator="ClinicEZ PHR System">
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={[s.header, { backgroundColor: tc.headerBg }]}>
          {/* ClinicEZ text logo in a white pill — SVG/Image not supported server-side */}
          <View style={s.logoBox}>
            <Text style={s.logoText}>ClinicEZ</Text>
          </View>

          <View style={s.headerRight}>
            <Text style={[s.docTitle, { color: tc.headerColor }]}>Personal Health Record</Text>
            <Text style={[s.headerMeta, { color: tc.headerColor }]}>Generated: {generatedAt}</Text>
            <Text style={[s.headerMeta, { color: tc.headerColor }]}>Comprehensive PHR</Text>
          </View>
        </View>

        {/* ── Patient bar ── */}
        <View style={[s.patientBar, { backgroundColor: tc.patientBarBg }]}>
          {patient.picture ? (
            <Image src={patient.picture} style={s.avatarImg} />
          ) : (
            <View style={[s.avatar, { backgroundColor: theme === 'minimal' ? '#e2e8f0' : 'rgba(255,255,255,0.25)' }]}>
              <Text style={[s.avatarText, { color: tc.patientBarText }]}>{initials}</Text>
            </View>
          )}
          <View style={s.patientInfo}>
            <Text style={[s.patientName, { color: tc.patientBarText }]}>{patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}</Text>
            <View style={s.patientMeta}>
              {patient.caseNumber ? <Text style={[s.patientMetaItem, { color: tc.patientBarText }]}>ID: {patient.caseNumber}</Text> : null}
              {patient.dob ? <Text style={[s.patientMetaItem, { color: tc.patientBarText }]}>DOB: {fmtDate(patient.dob)}</Text> : null}
              {patient.age ? <Text style={[s.patientMetaItem, { color: tc.patientBarText }]}>Age: {patient.age} yrs</Text> : null}
              {patient.gender ? <Text style={[s.patientMetaItem, { color: tc.patientBarText }]}>Gender: {cap(patient.gender)}</Text> : null}
              {showClinicName && patient.clinic?.name ? <Text style={[s.patientMetaItem, { color: tc.patientBarText }]}>Clinic: {patient.clinic.name}</Text> : null}
            </View>
          </View>
          <View style={[s.statsRow, { borderLeftColor: tc.patientBarBorderLeft }]}>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: theme === 'minimal' ? '#ef4444' : '#fca5a5' }]}>{fmtBloodType(patient.bloodType)}</Text>
              <Text style={[s.statLabel, { color: tc.patientBarText }]}>Blood Type</Text>
            </View>
            {lv?.bpSystolic ? (
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: tc.patientBarText }]}>{lv.bpSystolic}/{lv.bpDiastolic}</Text>
                <Text style={[s.statLabel, { color: tc.patientBarText }]}>BP mmHg</Text>
              </View>
            ) : null}
            {lv?.weight ? (
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: tc.patientBarText }]}>{lv.weight}</Text>
                <Text style={[s.statLabel, { color: tc.patientBarText }]}>Weight kg</Text>
              </View>
            ) : null}
            {lv?.height ? (
              <View style={s.statBox}>
                <Text style={[s.statValue, { color: tc.patientBarText }]}>{lv.height}</Text>
                <Text style={[s.statLabel, { color: tc.patientBarText }]}>Height cm</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─────────── DEMOGRAPHICS ─────────── */}
        {has('demographics') && (
          <View style={s.section}>
            <SecHeader icon="📋" title="Demographics" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              <View style={s.fieldGrid3}>
                <Field label="Full Name" value={`${patient.fullName}${patient.suffix ? ` ${patient.suffix}` : ''}`} />
                <Field label="Nickname" value={patient.nickname} />
                <Field label="Date of Birth" value={fmtDate(patient.dob)} />
                <Field label="Age" value={patient.age ? `${patient.age} years` : null} />
                <Field label="Gender" value={cap(patient.gender)} />
                <Field label="Civil Status" value={cap(patient.civilStatus)} />
                <Field label="Blood Type" value={fmtBloodType(patient.bloodType)} />
                <Field label="Nationality" value={patient.nationality} />
                <Field label="Religion" value={patient.religion} />
                <Field label="Place of Birth" value={patient.placeOfBirth} />
                <Field label="Email" value={patient.email} />
                <Field label="Mobile" value={patient.mobile} />
                <Field label="Telephone" value={patient.telephone} />
                {patient.caseNumber ? <Field label="Patient ID" value={patient.caseNumber} /> : null}
                <Field label="Member Since" value={fmtDate(patient.createdAt)} />
              </View>
            </View>
          </View>
        )}

        {/* ─────────── VITAL SIGNS ─────────── */}
        {has('vitals') && (
          <View style={s.section}>
            <SecHeader icon="❤️" title="Vital Signs" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {lv ? (
                <>
                  <Text style={[s.subLabel, { marginBottom: 6 }]}>Latest Reading — {fmtDateTime(lv.dateTaken)}</Text>
                  <View style={s.vitalRow}>
                    {lv.bpSystolic ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.bpSystolic}/{lv.bpDiastolic}</Text><Text style={s.vitalLabel}>BP (mmHg)</Text></View>) : null}
                    {lv.pulseRate ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.pulseRate}</Text><Text style={s.vitalLabel}>HR (bpm)</Text></View>) : null}
                    {lv.temp ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.temp}</Text><Text style={s.vitalLabel}>Temp (°C)</Text></View>) : null}
                    {lv.spo2 ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.spo2}%</Text><Text style={s.vitalLabel}>SpO2</Text></View>) : null}
                    {lv.respRate ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.respRate}</Text><Text style={s.vitalLabel}>RR (/min)</Text></View>) : null}
                    {displayBMI ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{displayBMI}</Text><Text style={s.vitalLabel}>BMI</Text></View>) : null}
                    {lv.height ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.height}</Text><Text style={s.vitalLabel}>Height (cm)</Text></View>) : null}
                    {lv.weight ? (<View style={[s.vitalCard, { backgroundColor: tc.vitalCardBg, borderColor: tc.vitalCardBorder }]}><Text style={[s.vitalValue, { color: tc.vitalValueColor }]}>{lv.weight}</Text><Text style={s.vitalLabel}>Weight (kg)</Text></View>) : null}
                  </View>
                </>
              ) : <Empty msg="No vital signs recorded." />}

              {patient.vitalSigns.length > 1 && (
                <>
                  <Text style={[s.subLabel, { marginTop: 8, marginBottom: 4 }]}>Vital Signs History</Text>
                  <View style={s.table}>
                    <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}>
                      <Th flex={1.2} tc={tc}>Date</Th>
                      <Th flex={1} tc={tc}>BP</Th>
                      <Th flex={0.8} tc={tc}>HR</Th>
                      <Th flex={0.8} tc={tc}>Temp</Th>
                      <Th flex={0.8} tc={tc}>SpO2</Th>
                      <Th flex={0.8} tc={tc}>Wt (kg)</Th>
                      <Th flex={0.8} tc={tc}>Ht (cm)</Th>
                      <Th flex={0.8} tc={tc}>BMI</Th>
                    </View>
                    {patient.vitalSigns.map((vs, i) => (
                      <View key={vs.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Td flex={1.2} alt={i % 2 !== 0}>{fmtDate(vs.dateTaken)}</Td>
                        <Td flex={1} alt={i % 2 !== 0}>{vs.bpSystolic ? `${vs.bpSystolic}/${vs.bpDiastolic}` : '—'}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{v(vs.pulseRate)}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{v(vs.temp)}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{vs.spo2 ? `${vs.spo2}%` : '—'}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{v(vs.weight)}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{v(vs.height)}</Td>
                        <Td flex={0.8} alt={i % 2 !== 0}>{v(vs.bmi ?? calcBmi(vs.weight, vs.height))}</Td>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ─────────── MEDICAL HISTORY ─────────── */}
        {has('medical') && (
          <View style={s.section}>
            <SecHeader icon="🏥" title="Medical History" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              <Text style={s.subLabel}>Personal Medical Conditions</Text>
              {patient.medicalHistories.length === 0 ? <Empty msg="No personal medical conditions recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1} tc={tc}>Condition</Th><Th flex={2} tc={tc}>Details</Th></View>
                  {patient.medicalHistories.map((m, i) => (
                    <View key={m.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1} alt={i % 2 !== 0}>{m.condition}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(m.details)}</Td>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[s.subLabel, { marginTop: 8 }]}>Family Medical History</Text>
              {patient.familyMedicalHistories.length === 0 ? <Empty msg="No family medical history recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1} tc={tc}>Condition</Th><Th flex={2} tc={tc}>Details</Th></View>
                  {patient.familyMedicalHistories.map((m, i) => (
                    <View key={m.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1} alt={i % 2 !== 0}>{m.condition}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(m.details)}</Td>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[s.subLabel, { marginTop: 8 }]}>Surgical History</Text>
              {patient.surgicalHistories.length === 0 ? <Empty msg="No surgical history recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={2} tc={tc}>Operation</Th><Th flex={1} tc={tc}>Date</Th><Th flex={2} tc={tc}>Notes</Th></View>
                  {patient.surgicalHistories.map((sr, i) => (
                    <View key={sr.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={2} alt={i % 2 !== 0}>{sr.operationName}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(sr.operationDate)}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(sr.notes)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── ALLERGIES ─────────── */}
        {has('allergies') && (
          <View style={s.section}>
            <SecHeader icon="⚠️" title="Allergies" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.userAllergies.length === 0 ? <Empty msg="No known allergies recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1} tc={tc}>Allergen</Th><Th flex={1} tc={tc}>Reaction</Th><Th flex={2} tc={tc}>Notes</Th></View>
                  {patient.userAllergies.map((a, i) => (
                    <View key={a.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1} alt={i % 2 !== 0}>{a.allergen}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{a.reaction}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(a.notes)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── VACCINATIONS ─────────── */}
        {has('vaccinations') && (
          <View style={s.section}>
            <SecHeader icon="💉" title="Vaccinations" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.userVaccinations.length === 0 ? <Empty msg="No vaccinations recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1.5} tc={tc}>Vaccine</Th><Th flex={0.8} tc={tc}>Dose</Th><Th flex={0.8} tc={tc}>Route</Th><Th flex={1} tc={tc}>Date</Th><Th flex={1.5} tc={tc}>Administered By</Th><Th flex={1.5} tc={tc}>Notes</Th></View>
                  {patient.userVaccinations.map((vac, i) => (
                    <View key={vac.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1.5} alt={i % 2 !== 0}>{vac.vaccine}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{vac.dose}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{vac.route}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(vac.dateGiven)}</Td>
                      <Td flex={1.5} alt={i % 2 !== 0}>{v(vac.administeredBy)}</Td>
                      <Td flex={1.5} alt={i % 2 !== 0}>{v(vac.notes)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── DISABILITIES ─────────── */}
        {has('disabilities') && (
          <View style={s.section}>
            <SecHeader icon="♿" title="Disabilities & Chronic Conditions" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.userDisabilities.length === 0 ? <Empty msg="No disabilities or chronic conditions recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1.5} tc={tc}>Condition</Th><Th flex={1} tc={tc}>Date Diagnosed</Th><Th flex={0.8} tc={tc}>Severity</Th><Th flex={0.7} tc={tc}>Managed</Th><Th flex={1.2} tc={tc}>Diagnosed By</Th><Th flex={1.5} tc={tc}>Notes</Th></View>
                  {patient.userDisabilities.map((d, i) => (
                    <View key={d.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1.5} alt={i % 2 !== 0}>{d.disability}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(d.dateDiagnosed)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{cap(d.severity)}</Td>
                      <Td flex={0.7} alt={i % 2 !== 0}>{d.isManaged === null ? '—' : d.isManaged ? 'Yes' : 'No'}</Td>
                      <Td flex={1.2} alt={i % 2 !== 0}>{v(d.diagnosedBy)}</Td>
                      <Td flex={1.5} alt={i % 2 !== 0}>{v(d.notes)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── EMERGENCY CONTACTS ─────────── */}
        {has('contacts') && (
          <View style={s.section}>
            <SecHeader icon="🆘" title="Emergency Contacts" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.userEmergencyContacts.length === 0 ? <Empty msg="No emergency contacts recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1.5} tc={tc}>Name</Th><Th flex={1} tc={tc}>Relationship</Th><Th flex={1} tc={tc}>Phone</Th><Th flex={0.8} tc={tc}>Primary</Th><Th flex={2} tc={tc}>Address</Th></View>
                  {patient.userEmergencyContacts.map((c, i) => (
                    <View key={c.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1.5} alt={i % 2 !== 0}>{c.name}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{c.relationship}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{c.phone}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{c.isPrimary ? 'Yes' : 'No'}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(c.address)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── ADDRESSES ─────────── */}
        {has('addresses') && (
          <View style={s.section}>
            <SecHeader icon="📍" title="Addresses" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.userAddresses.length === 0 ? <Empty msg="No addresses recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={0.7} tc={tc}>Type</Th><Th flex={2} tc={tc}>Street / Address Line</Th><Th flex={1} tc={tc}>Barangay</Th><Th flex={1} tc={tc}>City</Th><Th flex={1} tc={tc}>State/Province</Th><Th flex={0.7} tc={tc}>Zip</Th><Th flex={1} tc={tc}>Country</Th></View>
                  {patient.userAddresses.map((a, i) => (
                    <View key={a.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={0.7} alt={i % 2 !== 0}>{a.isPrimary ? 'Primary' : 'Other'}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{a.address}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{v(a.barangay)}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{a.city}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{a.state}</Td>
                      <Td flex={0.7} alt={i % 2 !== 0}>{a.zipCode}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{a.country}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── LIFESTYLE ─────────── */}
        {has('lifestyle') && (
          <View style={s.section}>
            <SecHeader icon="👤" title="Lifestyle & Social History" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {!patient.personalHistory ? <Empty msg="No lifestyle / social history recorded." /> : (
                <View style={s.fieldGrid3}>
                  <Field label="Smoking Status" value={cap(patient.personalHistory.smokingStatus)} />
                  {patient.personalHistory.numberOfPacksPerYear !== null && patient.personalHistory.numberOfPacksPerYear !== undefined && <Field label="Packs / Year" value={String(patient.personalHistory.numberOfPacksPerYear)} />}
                  <Field label="Alcohol Use" value={cap(patient.personalHistory.alcoholStatus)} />
                  {patient.personalHistory.numberOfBottlesPerDay !== null && patient.personalHistory.numberOfBottlesPerDay !== undefined && <Field label="Bottles / Day" value={String(patient.personalHistory.numberOfBottlesPerDay)} />}
                  <Field label="Illicit Drug Use" value={cap(patient.personalHistory.illicitDrugUse)} />
                  <Field label="Sexually Active" value={cap(patient.personalHistory.sexuallyActive)} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── OB/GYN ─────────── */}
        {has('obgyn') && (
          <View style={s.section}>
            <SecHeader icon="👶" title="OB/GYN History" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {!patient.obGyneHistory ? <Empty msg="No OB/GYN history recorded." /> : (
                <View style={s.fieldGrid3}>
                  {patient.obGyneHistory.menarche != null && <Field label="Menarche (age)" value={String(patient.obGyneHistory.menarche)} />}
                  {patient.obGyneHistory.lastMenstrualPeriod && <Field label="Last Menstrual Period" value={fmtDate(patient.obGyneHistory.lastMenstrualPeriod)} />}
                  {patient.obGyneHistory.menstrualCycleInterval != null && <Field label="Cycle Interval (days)" value={String(patient.obGyneHistory.menstrualCycleInterval)} />}
                  {patient.obGyneHistory.menstrualPeriodDuration != null && <Field label="Period Duration (days)" value={String(patient.obGyneHistory.menstrualPeriodDuration)} />}
                  {patient.obGyneHistory.gravidity != null && <Field label="Gravida" value={String(patient.obGyneHistory.gravidity)} />}
                  {patient.obGyneHistory.parity != null && <Field label="Para" value={String(patient.obGyneHistory.parity)} />}
                  {patient.obGyneHistory.fullTerm != null && <Field label="Full Term" value={String(patient.obGyneHistory.fullTerm)} />}
                  {patient.obGyneHistory.premature != null && <Field label="Premature" value={String(patient.obGyneHistory.premature)} />}
                  {patient.obGyneHistory.abortion != null && <Field label="Abortion" value={String(patient.obGyneHistory.abortion)} />}
                  {patient.obGyneHistory.livingChildren != null && <Field label="Living Children" value={String(patient.obGyneHistory.livingChildren)} />}
                  {patient.obGyneHistory.typeOfDelivery && <Field label="Type of Delivery" value={patient.obGyneHistory.typeOfDelivery} />}
                  {patient.obGyneHistory.birthControlMethod && <Field label="Birth Control Method" value={patient.obGyneHistory.birthControlMethod} />}
                  {patient.obGyneHistory.menopauseAge != null && <Field label="Menopause Age" value={String(patient.obGyneHistory.menopauseAge)} />}
                  {patient.obGyneHistory.menopauseStatus && <Field label="Menopause Status" value={patient.obGyneHistory.menopauseStatus} />}
                  <Field label="Pre-eclampsia History" value={patient.obGyneHistory.hasPreEclampsia ? 'Yes' : 'No'} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── PEDIATRIC ─────────── */}
        {has('pediatric') && (
          <View style={s.section}>
            <SecHeader icon="📏" title="Pediatric Measurements" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.pediatricMeasurements.length === 0 ? <Empty msg="No pediatric measurements recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1} tc={tc}>Date</Th><Th flex={0.8} tc={tc}>Length</Th><Th flex={0.8} tc={tc}>Head Circ.</Th><Th flex={0.8} tc={tc}>Waist</Th><Th flex={0.8} tc={tc}>Hip</Th><Th flex={0.8} tc={tc}>MUAC</Th><Th flex={1.5} tc={tc}>Remarks</Th></View>
                  {patient.pediatricMeasurements.map((pm, i) => (
                    <View key={pm.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(pm.dateTaken)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{v(pm.length)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{v(pm.headCircumference)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{v(pm.waistCircumference)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{v(pm.hipCircumference)}</Td>
                      <Td flex={0.8} alt={i % 2 !== 0}>{v(pm.midUpperArmCircumference)}</Td>
                      <Td flex={1.5} alt={i % 2 !== 0}>{v(pm.remarks)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── PHYSICAL EXAMS ─────────── */}
        {has('exams') && (
          <View style={s.section}>
            <SecHeader icon="🔍" title="Physical Examinations" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              {patient.physicalExaminations.length === 0 ? <Empty msg="No physical examinations recorded." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1} tc={tc}>Date</Th><Th flex={1} tc={tc}>Visual Acuity — Left</Th><Th flex={1} tc={tc}>Visual Acuity — Right</Th><Th flex={2} tc={tc}>Status / Notes</Th></View>
                  {patient.physicalExaminations.map((e, i) => (
                    <View key={e.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(e.createdAt)}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{v(e.visualAcuityLeft)}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{v(e.visualAcuityRight)}</Td>
                      <Td flex={2} alt={i % 2 !== 0}>{v(e.status)}</Td>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─────────── INSURANCE ─────────── */}
        {has('insurance') && (
          <View style={s.section}>
            <SecHeader icon="📄" title="Insurance & Documents" tc={tc} />
            <View style={[s.sectionBody, { borderColor: tc.sectionBodyBorder }]}>
              <Text style={s.subLabel}>PhilHealth Records</Text>
              {patient.philHealthRecords.length === 0 ? <Empty msg="No PhilHealth records." /> : (
                <View style={s.table}>
                  <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={1.5} tc={tc}>PIN</Th><Th flex={1.5} tc={tc}>Member Type</Th><Th flex={0.6} tc={tc}>Active</Th><Th flex={1} tc={tc}>Date Added</Th></View>
                  {patient.philHealthRecords.map((r, i) => (
                    <View key={r.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                      <Td flex={1.5} alt={i % 2 !== 0}>{v(r.pin)}</Td>
                      <Td flex={1.5} alt={i % 2 !== 0}>{r.PhilHealthMemberType?.name ?? '—'}</Td>
                      <Td flex={0.6} alt={i % 2 !== 0}>{r.isActive ? 'Yes' : 'No'}</Td>
                      <Td flex={1} alt={i % 2 !== 0}>{fmtDate(r.createdAt)}</Td>
                    </View>
                  ))}
                </View>
              )}

              {patient.referralSlips.length > 0 && (
                <>
                  <Text style={[s.subLabel, { marginTop: 8 }]}>Referral Slips</Text>
                  <View style={s.table}>
                    <View style={[s.tableHead, { backgroundColor: tc.tableHeadBg }]}><Th flex={0.8} tc={tc}>Serial #</Th><Th flex={1.5} tc={tc}>Referred To</Th><Th flex={2} tc={tc}>Reason</Th><Th flex={1.5} tc={tc}>Clinic</Th><Th flex={1} tc={tc}>Date</Th></View>
                    {patient.referralSlips.map((rs, i) => (
                      <View key={rs.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Td flex={0.8} alt={i % 2 !== 0}>{rs.serialNumber}</Td>
                        <Td flex={1.5} alt={i % 2 !== 0}>{v(rs.referredTo)}</Td>
                        <Td flex={2} alt={i % 2 !== 0}>{v(rs.reason)}</Td>
                        <Td flex={1.5} alt={i % 2 !== 0}>{v(rs.clinic)}</Td>
                        <Td flex={1} alt={i % 2 !== 0}>{fmtDate(rs.createdAt)}</Td>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <Footer generatedAt={generatedAt} clinicName={patient.clinic?.name} showClinicName={showClinicName} tc={tc} />
      </Page>
    </Document>
  )
}
