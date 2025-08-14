"use server"

import path from "path"
import fs from "fs"
import { PDFDocument } from "pdf-lib"
import { logger } from "@/lib/logger"

export interface LoadPdfResult {
  pdfDoc: PDFDocument
  form: ReturnType<PDFDocument["getForm"]>
  bytes: Uint8Array
  filePath: string
}

// simple in-memory cache for template bytes within a single runtime
const templateCache = new Map<string, Uint8Array>()

export async function loadPhilHealthPdf(fileName: string): Promise<LoadPdfResult> {
  // Prefer public assets path (Vercel-friendly); fallback to legacy root path for local dev
  console.log(`Current working directory: ${process.cwd()}`)
  const publicPath = path.resolve(`./public/pdfs/phr/${fileName}`)
  console.log(`Looking for PDF template at public path: ${publicPath}`)
  const legacyPath = path.resolve(process.cwd(), "pdfs", "phr", fileName)
  console.log(`Looking for PDF template at legacy path: ${legacyPath}`)
  const chosenPath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(legacyPath) ? legacyPath : null)
  console.log(`Chosen PDF template path: ${chosenPath}`)
  if (!chosenPath) throw new Error(`PDF template not found: ${fileName}. Looked in public/pdfs/phr and pdfs/phr.`)
  let bytes = templateCache.get(chosenPath)
  if (!bytes) {
    const raw = fs.readFileSync(chosenPath)
    bytes = new Uint8Array(raw)
    templateCache.set(chosenPath, bytes)
  }
  const pdfDoc = await PDFDocument.load(bytes)
  const form = pdfDoc.getForm()
  return { pdfDoc, form, bytes, filePath: chosenPath }
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
