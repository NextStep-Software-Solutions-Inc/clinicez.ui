"use server"

import { PDFDocument } from "pdf-lib"
import { logger } from "@/lib/logger"
import fs from "fs/promises"
import path from "path"

export interface LoadPdfResult {
  pdfDoc: PDFDocument
  form: ReturnType<PDFDocument["getForm"]>
  bytes: Uint8Array
  filePath: string
}

export async function loadPhilHealthPdf(fileName: string): Promise<LoadPdfResult> {
  try {
    // Use filesystem access instead of HTTP requests for better reliability
    const publicDir = path.join(process.cwd(), 'public', 'pdfs', 'phr')
    const filePath = path.join(publicDir, fileName)

    // Validate file exists and is within the expected directory for security
    const normalizedPath = path.normalize(filePath)
    const normalizedPublicDir = path.normalize(publicDir)

    if (!normalizedPath.startsWith(normalizedPublicDir)) {
      throw new Error(`Access denied: File path is outside allowed directory`)
    }

    // Check if file exists
    try {
      await fs.access(filePath, fs.constants.F_OK)
    } catch {
      throw new Error(`PDF template not found: ${fileName}`)
    }

    // Read the PDF file
    const fileBuffer = await fs.readFile(filePath)
    const bytes = new Uint8Array(fileBuffer)

    if (bytes.length === 0) {
      throw new Error(`PDF template is empty: ${fileName}`)
    }

    // Load PDF document
    const pdfDoc = await PDFDocument.load(bytes)
    const form = pdfDoc.getForm()

    logger.info(`Successfully loaded PDF template: ${fileName}`)

    return { pdfDoc, form, bytes, filePath }
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
