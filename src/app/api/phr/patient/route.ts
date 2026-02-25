import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { getPatientHealthRecords } from '@/actions/patient-profile/get-patient-health-records'
import { PHRPrintContent, PHR_SECTIONS, type PHRSectionId, type PHRTheme } from '@/components/v2/phr/PHRPrintContent'
import type { SerializedPatientHealthRecordsResponse } from '@/types/patient-profile'
import { buildFooterTemplate, htmlToPdf } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
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

        // Import renderToString only when needed
        const { renderToString } = await import('react-dom/server')

        const htmlContent = renderToString(
            React.createElement(PHRPrintContent, {
                patient: patient as SerializedPatientHealthRecordsResponse,
                sections,
                generatedAt,
                theme,
            })
        )

        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Personal Health Record — ClinicEZ</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; }
  </style>
</head>
<body>
  <div id="root">${htmlContent}</div>
</body>
</html>`

        // Generate PDF server-side for consistent output
        const footerTemplate = buildFooterTemplate({ theme, generatedAt })
        const pdfBuffer = await htmlToPdf(fullHtml, { footerTemplate })

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="PHR.pdf"',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        })
    } catch (error) {
        console.error('[PHR_API] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
