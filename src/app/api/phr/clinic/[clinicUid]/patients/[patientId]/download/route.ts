import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { getClinicPatientProfileAction } from '@/actions/clinics/get-clinic-patient-profile.action'
import { getCachedSession } from '@/actions/session.action'
import { PHRPdfDocument, PHR_SECTIONS, type PHRSectionId, type PHRTheme } from '@/components/v2/phr/PHRPdfDocument'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

interface RouteParams {
  params: Promise<{ clinicUid: string; patientId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getCachedSession()
  if (!session?.user?.sub) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clinicUid, patientId } = await params
  const numericPatientId = parseInt(patientId, 10)
  if (isNaN(numericPatientId)) {
    return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 })
  }

  const patient = await getClinicPatientProfileAction({ clinicUid, patientId: numericPatientId })
  if (!patient) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { searchParams } = request.nextUrl
  const rawSections = searchParams.get('sections') ?? 'all'
  const rawTheme = searchParams.get('theme')

  const allSectionIds = PHR_SECTIONS.map(s => s.id)
  const sanitized = rawSections.slice(0, 256).replace(/[^a-z,]/g, '')
  const sections: PHRSectionId[] = sanitized && sanitized !== 'all'
    ? (sanitized.split(',').filter(s => allSectionIds.includes(s as PHRSectionId)) as PHRSectionId[])
    : allSectionIds

  const theme: PHRTheme = rawTheme === 'minimal' ? 'minimal' : 'colorful'

  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderToBuffer(
      React.createElement(PHRPdfDocument, {
        patient: patient as SerializedPatientHealthRecordsResponse,
        sections,
        generatedAt,
        theme,
        showClinicName: true,
      }) as unknown as Parameters<typeof renderToBuffer>[0]
    )
  } catch (err) {
    console.error('[PHR_CLINIC_DOWNLOAD] renderToBuffer failed:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  const filename = `PHR_${patient.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.byteLength),
    },
  })
}
