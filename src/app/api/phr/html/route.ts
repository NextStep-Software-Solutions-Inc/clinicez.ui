import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { PHRPrintContent, PHR_SECTIONS, type PHRSectionId, type PHRTheme } from '@/components/v2/phr/PHRPrintContent'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const patient = await getPatientHealthRecords()
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

  const body = renderToString(
    createElement(PHRPrintContent, {
      patient: patient as SerializedPatientHealthRecordsResponse,
      sections,
      generatedAt,
      theme,
    })
  )

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Personal Health Record — ClinicEZ</title></head><body style="margin:0;padding:0;">${body}</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
