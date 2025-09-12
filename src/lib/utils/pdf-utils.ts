"use server"

import { PDFDocument } from "pdf-lib"
import { logger } from "@/lib/logger"

export interface LoadPdfResult {
  pdfDoc: PDFDocument
  form: ReturnType<PDFDocument["getForm"]>
  bytes: Uint8Array
  filePath: string
}

export async function loadPhilHealthPdf(fileName: string): Promise<LoadPdfResult> {
  try {
    // Use HTTP requests to access files from public directory (works in all environments)
    const pdfUrl = `/pdfs/phr/${fileName}`

    // Fetch the PDF from the public directory
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://clinicez.com' // fallback to production URL

    const fullUrl = `${baseUrl}${pdfUrl}`

    logger.info(`Fetching PhilHealth PDF template from: ${fullUrl}`)

    const response = await fetch(fullUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF template: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    if (bytes.length === 0) {
      throw new Error(`PDF template is empty: ${fileName}`)
    }

    // Load PDF document
    const pdfDoc = await PDFDocument.load(bytes)
    const form = pdfDoc.getForm()

    logger.info(`Successfully loaded PDF template: ${fileName}`)

    return { pdfDoc, form, bytes, filePath: pdfUrl }
  } catch (error) {
    logger.error(`Error loading PhilHealth PDF template "${fileName}":`, error)
    throw error
  }
}

export async function pdfBytesToBase64(bytes: Uint8Array): Promise<string> {
  return Buffer.from(bytes).toString("base64")
}

export interface TextFieldMapping { field: string; value: string | undefined | null }

export async function fillTextFields(form: ReturnType<PDFDocument["getForm"]>, mappings: TextFieldMapping[], fontSize = 8): Promise<number> {
  let filled = 0
  for (const { field, value } of mappings) {
    if (!value) continue
    try {
      const textField = form.getTextField(field)
      textField.setText(String(value))
      textField.setFontSize(fontSize)
      filled++
    } catch (error: unknown) {
      logger.error(`Error filling text field "${field}":`, error)
    }
  }
  return filled
}

export interface CheckBoxMapping { field: string; condition: boolean }

export async function processCheckboxes(form: ReturnType<PDFDocument["getForm"]>, mappings: CheckBoxMapping[]): Promise<number> {
  let processed = 0
  for (const { field, condition } of mappings) {
    try {
      const cb = form.getCheckBox(field)
      condition ? cb.check() : cb.uncheck()
      processed++
    } catch (error: unknown) {
      logger.error(`Error processing checkbox "${field}":`, error)
    }
  }
  return processed
}
