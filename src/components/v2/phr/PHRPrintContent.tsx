import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { PHR_SECTIONS, type PHRSectionId, type PHRTheme } from './phr-sections'

export { PHR_SECTIONS, type PHRSectionId, type PHRTheme }

function formatBloodType(bt: string | null | undefined): string {
  if (!bt) return 'N/A'
  return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function capitalize(s: string | null | undefined): string {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function val(v: string | number | null | undefined, fallback = '—'): string {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

function bmi(weight: number | null, height: number | null): string {
  if (!weight || !height) return '—'
  return (weight / ((height / 100) ** 2)).toFixed(1)
}

const TEAL = '#10a8a1'
const TEAL_LIGHT = '#e6f7f7'
const TEAL_DARK = '#0a7a75'
const BORDER = '#d1d5db'
const TEXT = '#1e293b'
const TEXT_MUTED = '#64748b'
const BG_SECTION = '#f8fafc'

const styles = {
  page: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    color: TEXT,
    background: '#ffffff',
    fontSize: '11px',
    lineHeight: '1.5',
    maxWidth: '850px',
    margin: '0 auto',
    padding: '0',
  } as React.CSSProperties,
  header: {
    background: TEAL,
    color: '#ffffff',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as React.CSSProperties,
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    color: '#ffffff',
  } as React.CSSProperties,
  headerRight: {
    textAlign: 'right' as const,
    fontSize: '10px',
    opacity: 0.9,
  } as React.CSSProperties,
  docTitle: {
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  patientBar: {
    background: TEAL_DARK,
    color: '#ffffff',
    padding: '12px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  } as React.CSSProperties,
  patientAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    border: '2px solid rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '700',
    flexShrink: 0,
  } as React.CSSProperties,
  patientInfo: {
    flex: 1,
  } as React.CSSProperties,
  patientName: {
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  patientMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginTop: '4px',
    fontSize: '10.5px',
    opacity: 0.85,
  } as React.CSSProperties,
  patientKeyStats: {
    display: 'flex',
    gap: '20px',
    borderLeft: '1px solid rgba(255,255,255,0.3)',
    paddingLeft: '20px',
  } as React.CSSProperties,
  statItem: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  statValue: {
    fontSize: '16px',
    fontWeight: '700',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '9px',
    opacity: 0.75,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  body: {
    padding: '24px 32px',
  } as React.CSSProperties,
  section: {
    marginBottom: '24px',
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: TEAL,
    color: '#ffffff',
    borderRadius: '4px 4px 0 0',
    fontSize: '11.5px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  sectionIcon: {
    fontSize: '13px',
  } as React.CSSProperties,
  sectionBody: {
    border: `1px solid ${TEAL}`,
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    background: '#ffffff',
    padding: '12px',
  } as React.CSSProperties,
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 24px',
  } as React.CSSProperties,
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '8px 16px',
  } as React.CSSProperties,
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px',
  } as React.CSSProperties,
  fieldLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  fieldValue: {
    fontSize: '11px',
    color: TEXT,
    fontWeight: '500',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '10.5px',
  } as React.CSSProperties,
  th: {
    background: TEAL_LIGHT,
    color: TEAL_DARK,
    fontWeight: '700',
    padding: '6px 8px',
    textAlign: 'left' as const,
    border: `1px solid ${BORDER}`,
    fontSize: '9.5px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  } as React.CSSProperties,
  td: {
    padding: '5px 8px',
    border: `1px solid ${BORDER}`,
    verticalAlign: 'top' as const,
    color: TEXT,
  } as React.CSSProperties,
  tdAlt: {
    padding: '5px 8px',
    border: `1px solid ${BORDER}`,
    verticalAlign: 'top' as const,
    background: BG_SECTION,
    color: TEXT,
  } as React.CSSProperties,
  empty: {
    color: TEXT_MUTED,
    fontStyle: 'italic',
    fontSize: '11px',
    padding: '8px 0',
  } as React.CSSProperties,
  footer: {
    borderTop: `2px solid ${TEAL}`,
    padding: '10px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '9px',
    color: TEXT_MUTED,
    background: BG_SECTION,
  } as React.CSSProperties,
  confidential: {
    background: '#fef2f2',
    border: `1px solid #fecaca`,
    color: '#991b1b',
    padding: '4px 12px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '9.5px',
    fontWeight: '600',
  } as React.CSSProperties,
  vitalCard: {
    background: TEAL_LIGHT,
    border: `1px solid #a7d7d5`,
    borderRadius: '4px',
    padding: '8px 12px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  vitalValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: TEAL_DARK,
  } as React.CSSProperties,
  vitalLabel: {
    fontSize: '9px',
    color: TEXT_MUTED,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '2px',
  } as React.CSSProperties,
}

interface PHRPrintContentProps {
  patient: SerializedPatientHealthRecordsResponse
  sections: PHRSectionId[]
  generatedAt: string
  theme?: PHRTheme
  showClinicName?: boolean
}

function SectionHeader({ icon, title, sectionHeaderBg, sectionHeaderText }: { icon: string; title: string; sectionHeaderBg: string; sectionHeaderText: string }) {
  return (
    <div className="phr-section-header" style={{ ...styles.sectionHeader, background: sectionHeaderBg, color: sectionHeaderText }}>
      <span style={styles.sectionIcon}>{icon}</span>
      {title}
    </div>
  )
}

function EmptyRecord({ message }: { message: string }) {
  return <p style={styles.empty}>{message}</p>
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldValue}>{val(value)}</span>
    </div>
  )
}

export function PHRPrintContent({ patient, sections, generatedAt, theme = 'colorful', showClinicName = false }: PHRPrintContentProps) {
  const sectionSet = new Set(sections)
  const has = (id: PHRSectionId) => sectionSet.has(id)

  const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase()

  // Latest vitals
  const lv = patient.latestVitals
  const displayBMI = lv?.bmi ?? (lv ? bmi(lv.weight, lv.height) : null)

  // ── Minimal-theme colour overrides ──────────────────────────────────────────
  const isMinimal = theme === 'minimal'
  const t = {
    headerBg: isMinimal ? '#64748b' : TEAL,
    headerColor: '#ffffff',
    patientBarBg: isMinimal ? '#f1f5f9' : TEAL_DARK,
    patientBarText: isMinimal ? TEXT : '#ffffff',
    patientBarBorder: isMinimal ? '#cbd5e1' : 'rgba(255,255,255,0.3)',
    sectionHeaderBg: isMinimal ? '#e2e8f0' : TEAL,
    sectionHeaderText: isMinimal ? TEXT : '#ffffff',
    sectionBodyBorder: isMinimal ? '#cbd5e1' : TEAL,
    thBg: isMinimal ? '#f1f5f9' : TEAL_LIGHT,
    thColor: isMinimal ? '#475569' : TEAL_DARK,
    vitalCardBg: isMinimal ? '#f8fafc' : TEAL_LIGHT,
    vitalCardBorder: isMinimal ? '#cbd5e1' : '#a7d7d5',
    vitalValueColor: isMinimal ? TEXT : TEAL_DARK,
    footerBorder: isMinimal ? '#94a3b8' : TEAL,
    footerBrandColor: isMinimal ? '#334155' : TEAL_DARK,
  }

  return (
    <div style={styles.page}>
      {/* ── PRINT STYLE OVERRIDES ── */}
      <style>{`
        @media screen {
          .phr-footer { position: relative; margin-top: 24px; }
        }

        /* Page margins: no top margin on page 1, 0.5in top on pages 2+         */
        /* margin-bottom: 0.5in reserved for Puppeteer footerTemplate on all pages */
        @page { margin-top: 0.5in; margin-bottom: 0.5in; }
        @page :first { margin-top: 0; margin-bottom: 0.5in; }

        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }

          /* Keep header/patient-bar together, never split */
          .phr-header, .phr-patient-bar { page-break-inside: avoid; break-inside: avoid; }

          /* Each section: keep together on page */
          .phr-body > div { 
            page-break-inside: avoid; 
            break-inside: avoid;
          }
          .phr-section-header { page-break-after: avoid; break-after: avoid; }

          /* Prevent individual table rows from splitting */
          tr { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }

          /* Footer is rendered by Puppeteer footerTemplate — hide from print flow */
          .phr-footer { display: none !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="phr-header" style={{ ...styles.header, background: t.headerBg, color: t.headerColor }}>
        <div style={styles.logoArea}>
          {/* Original ClinicEZ logo in a white pill — no colour inversion */}
          <div style={{ background: '#ffffff', borderRadius: '0', padding: '4px 10px', display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/clinic-ez_logo.svg"
              alt="ClinicEZ Logo"
              style={{ height: '26px', display: 'block' }}
            />
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.docTitle}>Personal Health Record</div>
          <div style={{ marginTop: '4px' }}>Generated: {generatedAt}</div>
          <div>Document Type: Comprehensive PHR</div>
        </div>
      </div>

      {/* ── PATIENT BAR ── */}
      <div className="phr-patient-bar" style={{ ...styles.patientBar, background: t.patientBarBg, color: t.patientBarText }}>
        {patient.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={patient.picture}
            alt={patient.fullName}
            style={{ ...styles.patientAvatar, objectFit: 'cover' }}
          />
        ) : (
          <div style={styles.patientAvatar}>{initials}</div>
        )}
        <div style={styles.patientInfo}>
          <div style={styles.patientName}>
            {patient.fullName}{patient.suffix ? ` ${patient.suffix}` : ''}
          </div>
          <div style={styles.patientMeta}>
            {patient.caseNumber && <span>Patient ID: {patient.caseNumber}</span>}
            {patient.dob && <span>DOB: {formatDate(patient.dob)}</span>}
            {patient.age && <span>Age: {patient.age} yrs</span>}
            {patient.gender && <span>Gender: {capitalize(patient.gender)}</span>}
            {showClinicName && patient.clinic?.name && <span>Clinic: {patient.clinic.name}</span>}
          </div>
        </div>
        <div style={{ ...styles.patientKeyStats, borderLeft: `1px solid ${t.patientBarBorder}` }}>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: isMinimal ? '#dc2626' : '#fca5a5' }}>
              {formatBloodType(patient.bloodType)}
            </div>
            <div style={styles.statLabel}>Blood Type</div>
          </div>
          {lv && (
            <div style={styles.statItem}>
              <div style={styles.statValue}>
                {lv.bpSystolic}/{lv.bpDiastolic}
              </div>
              <div style={styles.statLabel}>BP mmHg</div>
            </div>
          )}
          {lv?.weight && (
            <div style={styles.statItem}>
              <div style={styles.statValue}>{lv.weight}</div>
              <div style={styles.statLabel}>Weight kg</div>
            </div>
          )}
          {lv?.height && (
            <div style={styles.statItem}>
              <div style={styles.statValue}>{lv.height}</div>
              <div style={styles.statLabel}>Height cm</div>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={styles.body} className="phr-root phr-body">

        {/* DEMOGRAPHICS */}
        {has('demographics') && (
          <div style={styles.section}>
            <SectionHeader icon="📋" title="Demographics" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              <table style={styles.table}>
                <tbody>
                  {[
                    ['Full Name', `${patient.fullName}${patient.suffix ? ` ${patient.suffix}` : ''}`],
                    ['Nickname', val(patient.nickname)],
                    ['Date of Birth', formatDate(patient.dob)],
                    ['Age', patient.age ? `${patient.age} years` : '—'],
                    ['Gender', capitalize(patient.gender)],
                    ['Civil Status', capitalize(patient.civilStatus)],
                    ['Blood Type', formatBloodType(patient.bloodType)],
                    ['Nationality', val(patient.nationality)],
                    ['Religion', val(patient.religion)],
                    ['Place of Birth', val(patient.placeOfBirth)],
                    ['Email', val(patient.email)],
                    ['Mobile', val(patient.mobile)],
                    ['Telephone', val(patient.telephone)],
                    ...(patient.caseNumber ? [['Patient ID', patient.caseNumber]] : []),
                    ['Member Since', formatDate(patient.createdAt)],
                  ].reduce<Array<Array<[string, string]>>>((rows, item, i) => {
                    if (i % 3 === 0) rows.push([])
                    rows[rows.length - 1].push(item as [string, string])
                    return rows
                  }, []).map((row, ri) => (
                    <tr key={ri}>
                      {row.map(([label, value]) => (
                        <td key={label} style={{ ...styles.td, width: '33%' }}>
                          <div style={styles.fieldLabel}>{label}</div>
                          <div style={styles.fieldValue}>{value}</div>
                        </td>
                      ))}
                      {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, j) => <td key={`empty-${j}`} style={styles.td} />)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADDRESSES */}
        {has('addresses') && (
          <div style={styles.section}>
            <SectionHeader icon="📍" title="Addresses" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.userAddresses.length === 0 ? (
                <EmptyRecord message="No addresses recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Type</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Street / Address Line</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Barangay</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>City</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>State / Province</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Region</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Zip</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.userAddresses.map((a, i) => (
                      <tr key={a.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          {a.isPrimary
                            ? <span style={{ ...styles.badge, background: '#dbeafe', color: '#1d4ed8' }}>Primary</span>
                            : <span style={{ ...styles.badge, background: '#f1f5f9', color: TEXT_MUTED }}>Other</span>}
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.address}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(a.barangay)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.city}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.state}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(a.region)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.zipCode}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* EMERGENCY CONTACTS */}
        {has('contacts') && (
          <div style={styles.section}>
            <SectionHeader icon="🆘" title="Emergency Contacts" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.userEmergencyContacts.length === 0 ? (
                <EmptyRecord message="No emergency contacts recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Name</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Relationship</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Phone</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Primary</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.userEmergencyContacts.map((c, i) => (
                      <tr key={c.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{c.name}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{c.relationship}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{c.phone}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>
                          {c.isPrimary ? (
                            <span style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}>Primary</span>
                          ) : 'No'}
                        </td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(c.address)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* DISABILITIES */}
        {has('disabilities') && (
          <div style={styles.section}>
            <SectionHeader icon="♿" title="Disabilities & Chronic Conditions" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.userDisabilities.length === 0 ? (
                <EmptyRecord message="No disabilities or chronic conditions recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Condition</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date Diagnosed</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Severity</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Managed</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Diagnosed By</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.userDisabilities.map((d, i) => (
                      <tr key={d.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{d.disability}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(d.dateDiagnosed)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{capitalize(d.severity)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{d.isManaged === null ? '—' : d.isManaged ? 'Yes' : 'No'}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(d.diagnosedBy)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(d.notes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* LIFESTYLE */}
        {has('lifestyle') && (
          <div style={styles.section}>
            <SectionHeader icon="👤" title="Lifestyle & Social History" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {!patient.personalHistory ? (
                <EmptyRecord message="No lifestyle / social history recorded." />
              ) : (
                <table style={styles.table}>
                  <tbody>
                    {((): Array<[string, string]> => {
                      const ph = patient.personalHistory!
                      const fields: Array<[string, string]> = [
                        ['Smoking Status', capitalize(ph.smokingStatus)],
                      ]
                      if (ph.numberOfPacksPerYear !== null && ph.numberOfPacksPerYear !== undefined) fields.push(['Packs / Year', String(ph.numberOfPacksPerYear)])
                      fields.push(['Alcohol Use', capitalize(ph.alcoholStatus)])
                      if (ph.numberOfBottlesPerDay !== null && ph.numberOfBottlesPerDay !== undefined) fields.push(['Bottles / Day', String(ph.numberOfBottlesPerDay)])
                      fields.push(['Illicit Drug Use', capitalize(ph.illicitDrugUse)])
                      fields.push(['Sexually Active', capitalize(ph.sexuallyActive)])
                      return fields
                    })().reduce<Array<Array<[string, string]>>>((rows, item, i) => {
                      if (i % 3 === 0) rows.push([])
                      rows[rows.length - 1].push(item)
                      return rows
                    }, []).map((row, ri) => (
                      <tr key={ri}>
                        {row.map(([label, value]) => (
                          <td key={label} style={{ ...styles.td, width: '33%' }}>
                            <div style={styles.fieldLabel}>{label}</div>
                            <div style={styles.fieldValue}>{value}</div>
                          </td>
                        ))}
                        {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, j) => <td key={`empty-${j}`} style={styles.td} />)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* MEDICAL HISTORY */}
        {has('medical') && (
          <div style={styles.section}>
            <SectionHeader icon="🏥" title="Medical History" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              <p style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Personal Medical Conditions</p>
              {patient.medicalHistories.length === 0 ? (
                <EmptyRecord message="No personal medical conditions recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Condition</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.medicalHistories.map((m, i) => (
                      <tr key={m.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{m.condition}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(m.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <p style={{ ...styles.fieldLabel, marginTop: '12px', marginBottom: '6px' }}>Family Medical History</p>
              {patient.familyMedicalHistories.length === 0 ? (
                <EmptyRecord message="No family medical history recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Condition</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.familyMedicalHistories.map((m, i) => (
                      <tr key={m.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{m.condition}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(m.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <p style={{ ...styles.fieldLabel, marginTop: '12px', marginBottom: '6px' }}>Surgical History</p>
              {patient.surgicalHistories.length === 0 ? (
                <EmptyRecord message="No surgical history recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Operation</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.surgicalHistories.map((s, i) => (
                      <tr key={s.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{s.operationName}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(s.operationDate)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(s.notes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ALLERGIES */}
        {has('allergies') && (
          <div style={styles.section}>
            <SectionHeader icon="⚠️" title="Allergies" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.userAllergies.length === 0 ? (
                <EmptyRecord message="No known allergies recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Allergen</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Reaction</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.userAllergies.map((a, i) => (
                      <tr key={a.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.allergen}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{a.reaction}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(a.notes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VACCINATIONS */}
        {has('vaccinations') && (
          <div style={styles.section}>
            <SectionHeader icon="💉" title="Vaccinations" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.userVaccinations.length === 0 ? (
                <EmptyRecord message="No vaccinations recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Vaccine</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Dose</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Route</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date Given</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Administered By</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.userVaccinations.map((v, i) => (
                      <tr key={v.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{v.vaccine}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{v.dose}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{v.route}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(v.dateGiven)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.administeredBy)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.notes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* VITAL SIGNS */}
        {has('vitals') && (
          <div style={styles.section}>
            <SectionHeader icon="❤️" title="Vital Signs" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {lv ? (
                <>
                  <p style={{ ...styles.fieldLabel, marginBottom: '8px' }}>
                    Latest Reading — {formatDateTime(lv.dateTaken)}
                  </p>
                  <table style={{ ...styles.table, marginBottom: '8px' }}>
                    <thead>
                      <tr>
                        {lv.bpSystolic && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>BP (mmHg)</th>}
                        {lv.pulseRate && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>HR (bpm)</th>}
                        {lv.temp && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Temp (°C)</th>}
                        {lv.spo2 && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>SpO2</th>}
                        {lv.respRate && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>RR (/min)</th>}
                        {displayBMI && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>BMI</th>}
                        {lv.height && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Height (cm)</th>}
                        {lv.weight && <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Weight (kg)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {lv.bpSystolic && <td style={styles.td}>{lv.bpSystolic}/{lv.bpDiastolic}</td>}
                        {lv.pulseRate && <td style={styles.td}>{lv.pulseRate}</td>}
                        {lv.temp && <td style={styles.td}>{lv.temp}</td>}
                        {lv.spo2 && <td style={styles.td}>{lv.spo2}%</td>}
                        {lv.respRate && <td style={styles.td}>{lv.respRate}</td>}
                        {displayBMI && <td style={styles.td}>{displayBMI}</td>}
                        {lv.height && <td style={styles.td}>{lv.height}</td>}
                        {lv.weight && <td style={styles.td}>{lv.weight}</td>}
                      </tr>
                    </tbody>
                  </table>
                </>
              ) : (
                <EmptyRecord message="No vital signs recorded." />
              )}

              {patient.vitalSigns.length > 1 && (
                <>
                  <p style={{ ...styles.fieldLabel, marginTop: '12px', marginBottom: '6px' }}>Vital Signs History</p>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>BP (mmHg)</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>HR (bpm)</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Temp (°C)</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>SpO2</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Weight (kg)</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Height (cm)</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>BMI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.vitalSigns.map((v, i) => {
                        const rowBmi = v.bmi ?? bmi(v.weight, v.height)
                        return (
                          <tr key={v.id}>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(v.dateTaken)}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.pulseRate)}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.temp)}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{v.spo2 ? `${v.spo2}%` : '—'}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.weight)}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(v.height)}</td>
                            <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{rowBmi ?? '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}

        {/* OB/GYN */}
        {has('obgyn') && (
          <div style={styles.section}>
            <SectionHeader icon="👶" title="OB/GYN History" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {!patient.obGyneHistory ? (
                <EmptyRecord message="No OB/GYN history recorded." />
              ) : (
                <table style={styles.table}>
                  <tbody>
                    {((): Array<[string, string]> => {
                      const og = patient.obGyneHistory!
                      const fields: Array<[string, string]> = []
                      if (og.menarche !== null && og.menarche !== undefined) fields.push(['Menarche (age)', String(og.menarche)])
                      if (og.lastMenstrualPeriod) fields.push(['Last Menstrual Period', formatDate(og.lastMenstrualPeriod)])
                      if (og.menstrualCycleInterval !== null && og.menstrualCycleInterval !== undefined) fields.push(['Cycle Interval (days)', String(og.menstrualCycleInterval)])
                      if (og.menstrualPeriodDuration !== null && og.menstrualPeriodDuration !== undefined) fields.push(['Period Duration (days)', String(og.menstrualPeriodDuration)])
                      if (og.numberOfPadsPerDay !== null && og.numberOfPadsPerDay !== undefined) fields.push(['Pads / Day', String(og.numberOfPadsPerDay)])
                      if (og.gravidity !== null && og.gravidity !== undefined) fields.push(['Gravida', String(og.gravidity)])
                      if (og.parity !== null && og.parity !== undefined) fields.push(['Para', String(og.parity)])
                      if (og.fullTerm !== null && og.fullTerm !== undefined) fields.push(['Full Term', String(og.fullTerm)])
                      if (og.premature !== null && og.premature !== undefined) fields.push(['Premature', String(og.premature)])
                      if (og.abortion !== null && og.abortion !== undefined) fields.push(['Abortion', String(og.abortion)])
                      if (og.livingChildren !== null && og.livingChildren !== undefined) fields.push(['Living Children', String(og.livingChildren)])
                      if (og.typeOfDelivery) fields.push(['Type of Delivery', og.typeOfDelivery])
                      if (og.birthControlMethod) fields.push(['Birth Control Method', og.birthControlMethod])
                      if (og.ageAtFirstSexualIntercourse !== null && og.ageAtFirstSexualIntercourse !== undefined) fields.push(['Age at 1st Intercourse', String(og.ageAtFirstSexualIntercourse)])
                      if (og.menopauseAge !== null && og.menopauseAge !== undefined) fields.push(['Menopause Age', String(og.menopauseAge)])
                      if (og.menopauseStatus) fields.push(['Menopause Status', og.menopauseStatus])
                      fields.push(['Pre-eclampsia History', og.hasPreEclampsia ? 'Yes' : 'No'])
                      return fields
                    })().reduce<Array<Array<[string, string]>>>((rows, item, i) => {
                      if (i % 3 === 0) rows.push([])
                      rows[rows.length - 1].push(item)
                      return rows
                    }, []).map((row, ri) => (
                      <tr key={ri}>
                        {row.map(([label, value]) => (
                          <td key={label} style={{ ...styles.td, width: '33%' }}>
                            <div style={styles.fieldLabel}>{label}</div>
                            <div style={styles.fieldValue}>{value}</div>
                          </td>
                        ))}
                        {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, j) => <td key={`empty-${j}`} style={styles.td} />)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PEDIATRIC */}
        {has('pediatric') && (
          <div style={styles.section}>
            <SectionHeader icon="📏" title="Pediatric Measurements" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.pediatricMeasurements.length === 0 ? (
                <EmptyRecord message="No pediatric measurements recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Length (cm)</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Head Circ. (cm)</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Waist Circ. (cm)</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Hip Circ. (cm)</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>MUAC (cm)</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.pediatricMeasurements.map((p, i) => (
                      <tr key={p.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(p.dateTaken)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.length)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.headCircumference)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.waistCircumference)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.hipCircumference)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.midUpperArmCircumference)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(p.remarks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PHYSICAL EXAMINATIONS */}
        {has('exams') && (
          <div style={styles.section}>
            <SectionHeader icon="🔍" title="Physical Examinations" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              {patient.physicalExaminations.length === 0 ? (
                <EmptyRecord message="No physical examinations recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Visual Acuity — Left</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Visual Acuity — Right</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Status / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.physicalExaminations.map((e, i) => (
                      <tr key={e.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(e.createdAt)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(e.visualAcuityLeft)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(e.visualAcuityRight)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(e.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* INSURANCE */}
        {has('insurance') && (
          <div style={styles.section}>
            <SectionHeader icon="📄" title="Insurance & Documents" sectionHeaderBg={t.sectionHeaderBg} sectionHeaderText={t.sectionHeaderText} />
            <div style={{ ...styles.sectionBody, border: `1px solid ${t.sectionBodyBorder}`, borderTop: 'none' }}>
              <p style={{ ...styles.fieldLabel, marginBottom: '6px' }}>PhilHealth Records</p>
              {patient.philHealthRecords.length === 0 ? (
                <EmptyRecord message="No PhilHealth records." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>PIN</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Member Type</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Active</th>
                      <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.philHealthRecords.map((r, i) => (
                      <tr key={r.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(r.pin)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{r.memberType === 'MM' ? 'Principal' : r.memberType === 'DD' ? 'Dependent' : '-'}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{r.isActive ? 'Yes' : 'No'}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {patient.referralSlips.length > 0 && (
                <>
                  <p style={{ ...styles.fieldLabel, marginTop: '12px', marginBottom: '6px' }}>Referral Slips</p>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Serial #</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Referred To</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Reason</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Clinic</th>
                        <th style={{ ...styles.th, background: t.thBg, color: t.thColor }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.referralSlips.map((r, i) => (
                        <tr key={r.id}>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{r.serialNumber}</td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(r.referredTo)}</td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(r.reason)}</td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(r.clinic)}</td>
                          <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{formatDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div className="phr-footer" style={{ ...styles.footer, borderTop: `2px solid ${t.footerBorder}` }}>
        <div>
          <div style={{ fontWeight: '600', color: t.footerBrandColor }}>ClinicEZ — Personal Health Record</div>
          <div>This document is confidential and intended solely for the named patient or authorized healthcare provider.</div>
        </div>
        <div style={styles.confidential}>CONFIDENTIAL</div>
        <div style={{ textAlign: 'right' }}>
          <div>Generated: {generatedAt}</div>
          {showClinicName && patient.clinic?.name && <div>Clinic: {patient.clinic.name}</div>}
        </div>
      </div>
    </div>
  )
}
