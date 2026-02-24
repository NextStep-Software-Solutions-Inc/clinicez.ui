import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { PHR_SECTIONS, type PHRSectionId } from './phr-sections'

export { PHR_SECTIONS, type PHRSectionId }

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
    pageBreakInside: 'avoid' as const,
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
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={styles.sectionHeader}>
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

export function PHRPrintContent({ patient, sections, generatedAt }: PHRPrintContentProps) {
  const sectionSet = new Set(sections)
  const has = (id: PHRSectionId) => sectionSet.has(id)

  const initials = `${patient.firstName?.[0] ?? ''}${patient.lastName?.[0] ?? ''}`.toUpperCase()

  // Latest vitals
  const lv = patient.latestVitals
  const displayBMI = lv?.bmi ?? (lv ? bmi(lv.weight, lv.height) : null)

  return (
    <div style={styles.page}>
      {/* ── PRINT STYLE OVERRIDES ── */}
      <style>{`
        @page { size: A4; margin: 15mm 10mm 22mm 10mm; }
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .phr-root { max-width: 100%; padding: 0; }
          .phr-footer { position: fixed; bottom: 0; left: 0; right: 0; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={styles.header}>
        <div style={styles.logoArea}>
          {/* White pill so the logo renders in its native teal-on-white colours */}
          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '5px 14px', display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/clinic-ez_logo.svg"
              alt="ClinicEZ Logo"
              style={{ height: '30px', display: 'block' }}
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
      <div style={styles.patientBar}>
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
            {patient.clinic?.name && <span>Clinic: {patient.clinic.name}</span>}
          </div>
        </div>
        <div style={styles.patientKeyStats}>
          <div style={styles.statItem}>
            <div style={{ ...styles.statValue, color: '#fca5a5' }}>
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
      <div style={styles.body} className="phr-root">

        {/* DEMOGRAPHICS */}
        {has('demographics') && (
          <div style={styles.section}>
            <SectionHeader icon="📋" title="Demographics" />
            <div style={styles.sectionBody}>
              <div style={styles.grid3}>
                <Field label="Full Name" value={`${patient.fullName}${patient.suffix ? ` ${patient.suffix}` : ''}`} />
                <Field label="Nickname" value={patient.nickname} />
                <Field label="Date of Birth" value={formatDate(patient.dob)} />
                <Field label="Age" value={patient.age ? `${patient.age} years` : null} />
                <Field label="Gender" value={capitalize(patient.gender)} />
                <Field label="Civil Status" value={capitalize(patient.civilStatus)} />
                <Field label="Blood Type" value={formatBloodType(patient.bloodType)} />
                <Field label="Nationality" value={patient.nationality} />
                <Field label="Religion" value={patient.religion} />
                <Field label="Place of Birth" value={patient.placeOfBirth} />
                <Field label="Email" value={patient.email} />
                <Field label="Mobile" value={patient.mobile} />
                <Field label="Telephone" value={patient.telephone} />
                {patient.caseNumber && <Field label="Patient ID" value={patient.caseNumber} />}
                <Field label="Member Since" value={formatDate(patient.createdAt)} />
              </div>
            </div>
          </div>
        )}

        {/* VITAL SIGNS */}
        {has('vitals') && (
          <div style={styles.section}>
            <SectionHeader icon="❤️" title="Vital Signs" />
            <div style={styles.sectionBody}>
              {lv ? (
                <>
                  <p style={{ ...styles.fieldLabel, marginBottom: '8px' }}>
                    Latest Reading — {formatDateTime(lv.dateTaken)}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {lv.bpSystolic && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.bpSystolic}/{lv.bpDiastolic}</div>
                        <div style={styles.vitalLabel}>BP (mmHg)</div>
                      </div>
                    )}
                    {lv.pulseRate && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.pulseRate}</div>
                        <div style={styles.vitalLabel}>HR (bpm)</div>
                      </div>
                    )}
                    {lv.temp && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.temp}</div>
                        <div style={styles.vitalLabel}>Temp (°C)</div>
                      </div>
                    )}
                    {lv.spo2 && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.spo2}%</div>
                        <div style={styles.vitalLabel}>SpO2</div>
                      </div>
                    )}
                    {lv.respRate && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.respRate}</div>
                        <div style={styles.vitalLabel}>RR (/min)</div>
                      </div>
                    )}
                    {displayBMI && (
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{displayBMI}</div>
                        <div style={styles.vitalLabel}>BMI</div>
                      </div>
                    )}
                  </div>
                  {lv.height && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      <div style={styles.vitalCard}>
                        <div style={styles.vitalValue}>{lv.height}</div>
                        <div style={styles.vitalLabel}>Height (cm)</div>
                      </div>
                      {lv.weight && (
                        <div style={styles.vitalCard}>
                          <div style={styles.vitalValue}>{lv.weight}</div>
                          <div style={styles.vitalLabel}>Weight (kg)</div>
                        </div>
                      )}
                    </div>
                  )}
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
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>BP (mmHg)</th>
                        <th style={styles.th}>HR (bpm)</th>
                        <th style={styles.th}>Temp (°C)</th>
                        <th style={styles.th}>SpO2</th>
                        <th style={styles.th}>Weight (kg)</th>
                        <th style={styles.th}>Height (cm)</th>
                        <th style={styles.th}>BMI</th>
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

        {/* MEDICAL HISTORY */}
        {has('medical') && (
          <div style={styles.section}>
            <SectionHeader icon="🏥" title="Medical History" />
            <div style={styles.sectionBody}>
              <p style={{ ...styles.fieldLabel, marginBottom: '6px' }}>Personal Medical Conditions</p>
              {patient.medicalHistories.length === 0 ? (
                <EmptyRecord message="No personal medical conditions recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Condition</th>
                      <th style={styles.th}>Details</th>
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
                      <th style={styles.th}>Condition</th>
                      <th style={styles.th}>Details</th>
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
                      <th style={styles.th}>Operation</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Notes</th>
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
            <SectionHeader icon="⚠️" title="Allergies" />
            <div style={styles.sectionBody}>
              {patient.userAllergies.length === 0 ? (
                <EmptyRecord message="No known allergies recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Allergen</th>
                      <th style={styles.th}>Reaction</th>
                      <th style={styles.th}>Notes</th>
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
            <SectionHeader icon="💉" title="Vaccinations" />
            <div style={styles.sectionBody}>
              {patient.userVaccinations.length === 0 ? (
                <EmptyRecord message="No vaccinations recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Vaccine</th>
                      <th style={styles.th}>Dose</th>
                      <th style={styles.th}>Route</th>
                      <th style={styles.th}>Date Given</th>
                      <th style={styles.th}>Administered By</th>
                      <th style={styles.th}>Notes</th>
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

        {/* DISABILITIES */}
        {has('disabilities') && (
          <div style={styles.section}>
            <SectionHeader icon="♿" title="Disabilities & Chronic Conditions" />
            <div style={styles.sectionBody}>
              {patient.userDisabilities.length === 0 ? (
                <EmptyRecord message="No disabilities or chronic conditions recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Condition</th>
                      <th style={styles.th}>Date Diagnosed</th>
                      <th style={styles.th}>Severity</th>
                      <th style={styles.th}>Managed</th>
                      <th style={styles.th}>Diagnosed By</th>
                      <th style={styles.th}>Notes</th>
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

        {/* EMERGENCY CONTACTS */}
        {has('contacts') && (
          <div style={styles.section}>
            <SectionHeader icon="🆘" title="Emergency Contacts" />
            <div style={styles.sectionBody}>
              {patient.userEmergencyContacts.length === 0 ? (
                <EmptyRecord message="No emergency contacts recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Relationship</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Primary</th>
                      <th style={styles.th}>Address</th>
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

        {/* ADDRESSES */}
        {has('addresses') && (
          <div style={styles.section}>
            <SectionHeader icon="📍" title="Addresses" />
            <div style={styles.sectionBody}>
              {patient.userAddresses.length === 0 ? (
                <EmptyRecord message="No addresses recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Street / Address Line</th>
                      <th style={styles.th}>Barangay</th>
                      <th style={styles.th}>City</th>
                      <th style={styles.th}>State / Province</th>
                      <th style={styles.th}>Region</th>
                      <th style={styles.th}>Zip</th>
                      <th style={styles.th}>Country</th>
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

        {/* LIFESTYLE */}
        {has('lifestyle') && (
          <div style={styles.section}>
            <SectionHeader icon="👤" title="Lifestyle & Social History" />
            <div style={styles.sectionBody}>
              {!patient.personalHistory ? (
                <EmptyRecord message="No lifestyle / social history recorded." />
              ) : (
                <div style={styles.grid3}>
                  <Field label="Smoking Status" value={capitalize(patient.personalHistory.smokingStatus)} />
                  {patient.personalHistory.numberOfPacksPerYear !== null && patient.personalHistory.numberOfPacksPerYear !== undefined && (
                    <Field label="Packs / Year" value={String(patient.personalHistory.numberOfPacksPerYear)} />
                  )}
                  <Field label="Alcohol Use" value={capitalize(patient.personalHistory.alcoholStatus)} />
                  {patient.personalHistory.numberOfBottlesPerDay !== null && patient.personalHistory.numberOfBottlesPerDay !== undefined && (
                    <Field label="Bottles / Day" value={String(patient.personalHistory.numberOfBottlesPerDay)} />
                  )}
                  <Field label="Illicit Drug Use" value={capitalize(patient.personalHistory.illicitDrugUse)} />
                  <Field label="Sexually Active" value={capitalize(patient.personalHistory.sexuallyActive)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* OB/GYN */}
        {has('obgyn') && (
          <div style={styles.section}>
            <SectionHeader icon="👶" title="OB/GYN History" />
            <div style={styles.sectionBody}>
              {!patient.obGyneHistory ? (
                <EmptyRecord message="No OB/GYN history recorded." />
              ) : (
                <div style={styles.grid3}>
                  {patient.obGyneHistory.menarche !== null && patient.obGyneHistory.menarche !== undefined && <Field label="Menarche (age)" value={String(patient.obGyneHistory.menarche)} />}
                  {patient.obGyneHistory.lastMenstrualPeriod && <Field label="Last Menstrual Period" value={formatDate(patient.obGyneHistory.lastMenstrualPeriod)} />}
                  {patient.obGyneHistory.menstrualCycleInterval !== null && patient.obGyneHistory.menstrualCycleInterval !== undefined && <Field label="Cycle Interval (days)" value={String(patient.obGyneHistory.menstrualCycleInterval)} />}
                  {patient.obGyneHistory.menstrualPeriodDuration !== null && patient.obGyneHistory.menstrualPeriodDuration !== undefined && <Field label="Period Duration (days)" value={String(patient.obGyneHistory.menstrualPeriodDuration)} />}
                  {patient.obGyneHistory.numberOfPadsPerDay !== null && patient.obGyneHistory.numberOfPadsPerDay !== undefined && <Field label="Pads / Day" value={String(patient.obGyneHistory.numberOfPadsPerDay)} />}
                  {patient.obGyneHistory.gravidity !== null && patient.obGyneHistory.gravidity !== undefined && <Field label="Gravida" value={String(patient.obGyneHistory.gravidity)} />}
                  {patient.obGyneHistory.parity !== null && patient.obGyneHistory.parity !== undefined && <Field label="Para" value={String(patient.obGyneHistory.parity)} />}
                  {patient.obGyneHistory.fullTerm !== null && patient.obGyneHistory.fullTerm !== undefined && <Field label="Full Term" value={String(patient.obGyneHistory.fullTerm)} />}
                  {patient.obGyneHistory.premature !== null && patient.obGyneHistory.premature !== undefined && <Field label="Premature" value={String(patient.obGyneHistory.premature)} />}
                  {patient.obGyneHistory.abortion !== null && patient.obGyneHistory.abortion !== undefined && <Field label="Abortion" value={String(patient.obGyneHistory.abortion)} />}
                  {patient.obGyneHistory.livingChildren !== null && patient.obGyneHistory.livingChildren !== undefined && <Field label="Living Children" value={String(patient.obGyneHistory.livingChildren)} />}
                  {patient.obGyneHistory.typeOfDelivery && <Field label="Type of Delivery" value={patient.obGyneHistory.typeOfDelivery} />}
                  {patient.obGyneHistory.birthControlMethod && <Field label="Birth Control Method" value={patient.obGyneHistory.birthControlMethod} />}
                  {patient.obGyneHistory.ageAtFirstSexualIntercourse !== null && patient.obGyneHistory.ageAtFirstSexualIntercourse !== undefined && <Field label="Age at 1st Intercourse" value={String(patient.obGyneHistory.ageAtFirstSexualIntercourse)} />}
                  {patient.obGyneHistory.menopauseAge !== null && patient.obGyneHistory.menopauseAge !== undefined && <Field label="Menopause Age" value={String(patient.obGyneHistory.menopauseAge)} />}
                  {patient.obGyneHistory.menopauseStatus && <Field label="Menopause Status" value={patient.obGyneHistory.menopauseStatus} />}
                  <Field label="Pre-eclampsia History" value={patient.obGyneHistory.hasPreEclampsia ? 'Yes' : 'No'} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* PEDIATRIC */}
        {has('pediatric') && (
          <div style={styles.section}>
            <SectionHeader icon="📏" title="Pediatric Measurements" />
            <div style={styles.sectionBody}>
              {patient.pediatricMeasurements.length === 0 ? (
                <EmptyRecord message="No pediatric measurements recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Length (cm)</th>
                      <th style={styles.th}>Head Circ. (cm)</th>
                      <th style={styles.th}>Waist Circ. (cm)</th>
                      <th style={styles.th}>Hip Circ. (cm)</th>
                      <th style={styles.th}>MUAC (cm)</th>
                      <th style={styles.th}>Remarks</th>
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
            <SectionHeader icon="🔍" title="Physical Examinations" />
            <div style={styles.sectionBody}>
              {patient.physicalExaminations.length === 0 ? (
                <EmptyRecord message="No physical examinations recorded." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Visual Acuity — Left</th>
                      <th style={styles.th}>Visual Acuity — Right</th>
                      <th style={styles.th}>Status / Notes</th>
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
            <SectionHeader icon="📄" title="Insurance & Documents" />
            <div style={styles.sectionBody}>
              <p style={{ ...styles.fieldLabel, marginBottom: '6px' }}>PhilHealth Records</p>
              {patient.philHealthRecords.length === 0 ? (
                <EmptyRecord message="No PhilHealth records." />
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>PIN</th>
                      <th style={styles.th}>Member Type</th>
                      <th style={styles.th}>Active</th>
                      <th style={styles.th}>Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.philHealthRecords.map((r, i) => (
                      <tr key={r.id}>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{val(r.pin)}</td>
                        <td style={i % 2 === 0 ? styles.td : styles.tdAlt}>{r.PhilHealthMemberType?.name ?? '—'}</td>
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
                        <th style={styles.th}>Serial #</th>
                        <th style={styles.th}>Referred To</th>
                        <th style={styles.th}>Reason</th>
                        <th style={styles.th}>Clinic</th>
                        <th style={styles.th}>Date</th>
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
      <div className="phr-footer" style={styles.footer}>
        <div>
          <div style={{ fontWeight: '600', color: TEAL_DARK }}>ClinicEZ — Personal Health Record</div>
          <div>This document is confidential and intended solely for the named patient or authorized healthcare provider.</div>
        </div>
        <div style={styles.confidential}>CONFIDENTIAL</div>
        <div style={{ textAlign: 'right' }}>
          <div>Generated: {generatedAt}</div>
          {patient.clinic?.name && <div>Clinic: {patient.clinic.name}</div>}
        </div>
      </div>
    </div>
  )
}
