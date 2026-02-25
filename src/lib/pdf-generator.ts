/**
 * Server-side PDF generation utility
 * Converts HTML to PDF using Puppeteer for consistent output across all devices/browsers
 */

import fs from 'fs'
import path from 'path'

let puppeteer: unknown = null

async function getPuppeteer() {
    if (!puppeteer) {
        try {
            puppeteer = await import('puppeteer')
        } catch {
            throw new Error('Puppeteer not installed. Run: pnpm add puppeteer')
        }
    }
    return puppeteer as { default: { launch: (opts: unknown) => Promise<unknown> } }
}

export interface PdfOptions {
    /** HTML string rendered in the bottom margin of every page */
    footerTemplate?: string
}

/**
 * Build an inline-styled footer template for Puppeteer's footerTemplate option.
 * Rendered in the page margin area — always at the physical bottom edge of every page.
 */
export function buildFooterTemplate(options: {
    theme: 'colorful' | 'minimal'
    generatedAt: string
    clinicName?: string
}): string {
    const borderColor = options.theme === 'minimal' ? '#94a3b8' : '#10a8a1'
    const brandColor = options.theme === 'minimal' ? '#334155' : '#0a7a75'
    const clinicLine = options.clinicName
        ? `<div>Clinic: ${options.clinicName}</div>`
        : ''

    return `
    <div style="width:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:8px;
                color:#64748b;border-top:2px solid ${borderColor};
                padding:6px 32px;display:flex;justify-content:space-between;
                align-items:center;background:#f8fafc;box-sizing:border-box;">
      <div>
        <div style="font-weight:600;color:${brandColor};">ClinicEZ — Personal Health Record</div>
        <div>This document is confidential and intended solely for the named patient or authorized healthcare provider.</div>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;
                  padding:3px 8px;border-radius:3px;font-size:8px;
                  font-weight:600;letter-spacing:0.5px;">
        CONFIDENTIAL
      </div>
      <div style="text-align:right;">
        <div>Generated: ${options.generatedAt}</div>
        ${clinicLine}
      </div>
    </div>`
}

/**
 * Replace src="/..." and href="/..." attributes pointing to local public assets
 * with inline base64 data URIs so Puppeteer can render them without a running server.
 */
function inlinePublicAssets(html: string): string {
    const publicDir = path.join(process.cwd(), 'public')

    const MIME: Record<string, string> = {
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
    }

    return html.replace(/(src|href)="(\/[^"]+)"/g, (match, attr, urlPath) => {
        const ext = path.extname(urlPath).toLowerCase()
        if (!MIME[ext]) return match               // not a known image type — leave as-is

        const filePath = path.join(publicDir, urlPath)
        if (!fs.existsSync(filePath)) return match // file not found — leave as-is

        const data = fs.readFileSync(filePath).toString('base64')
        return `${attr}="data:${MIME[ext]};base64,${data}"`
    })
}

export async function htmlToPdf(htmlContent: string, options: PdfOptions = {}): Promise<Buffer> {
    const puppeteerModule = await getPuppeteer()

    // Inline local public assets as base64 so Puppeteer can render them without a server
    const processedHtml = inlinePublicAssets(htmlContent)

    const browser = await puppeteerModule.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }) as { newPage: () => Promise<unknown>; close: () => Promise<void> }

    try {
        const page = await browser.newPage() as {
            setViewport: (v: unknown) => Promise<void>
            setContent: (html: string, opts: unknown) => Promise<void>
            pdf: (opts: unknown) => Promise<Uint8Array>
            close: () => Promise<void>
        }

        // Set viewport for consistent A4 rendering (A4: 210mm × 297mm at 96 DPI)
        await page.setViewport({ width: Math.round(210 * 3.78), height: Math.round(297 * 3.78) })

        // Set content
        await page.setContent(processedHtml, { waitUntil: 'networkidle0' })

        const hasFooter = !!options.footerTemplate

        // Generate PDF with A4 page size
        // @page CSS handles top margin per-page; Puppeteer handles bottom margin for footer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            // Margins are controlled by CSS @page rules in the HTML
            // Puppeteer margin is set to 0 to avoid conflicting with @page
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            printBackground: true,
            displayHeaderFooter: hasFooter,
            headerTemplate: '<span></span>',
            footerTemplate: options.footerTemplate ?? '<span></span>',
        })

        await page.close()
        return Buffer.from(pdfBuffer)
    } finally {
        await browser.close()
    }
}
