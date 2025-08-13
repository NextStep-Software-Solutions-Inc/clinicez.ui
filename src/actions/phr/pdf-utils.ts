"use server"

import path from "path"
import fs from "fs"
import { PDFDocument } from "pdf-lib"

export interface LoadPdfResult {
  pdfDoc: PDFDocument
  form: ReturnType<PDFDocument["getForm"]>
  bytes: Uint8Array
  filePath: string
}

/**
 * Loads a PhilHealth related PDF by filename from pdfs/phr directory.
 * Performs existence check and returns loaded PDF + form instance.
 */
export async function loadPhilHealthPdf(fileName: string): Promise<LoadPdfResult> {
  const filePath = path.resolve(process.cwd(), "pdfs", "phr", fileName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`${fileName} template not found at ${filePath}`)
  }
  const raw = fs.readFileSync(filePath)
  const bytes = new Uint8Array(raw)
  const pdfDoc = await PDFDocument.load(bytes)
  const form = pdfDoc.getForm()
  return { pdfDoc, form, bytes, filePath }
}

/** Converts PDF bytes to base64 string */
export function pdfBytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64")
}

export interface TextFieldMapping { field: string; value: string | undefined | null }

/** Utility to fill text fields defensively. Returns how many were set. */
export function fillTextFields(form: ReturnType<PDFDocument["getForm"]>, mappings: TextFieldMapping[], fontSize = 8): number {
  let filled = 0
  for (const { field, value } of mappings) {
    if (!value) continue
    try {
      const textField = form.getTextField(field)
      textField.setText(String(value))
      textField.setFontSize(fontSize)
      filled++
    } catch {
      // ignore missing field
    }
  }
  return filled
}

export interface CheckBoxMapping { field: string; condition: boolean }

/** Utility to (un)check checkboxes. Returns how many processed (existence based). */
export function processCheckboxes(form: ReturnType<PDFDocument["getForm"]>, mappings: CheckBoxMapping[]): number {
  let processed = 0
  for (const { field, condition } of mappings) {
    try {
      const cb = form.getCheckBox(field)
      condition ? cb.check() : cb.uncheck()
      processed++
    } catch {
      // ignore
    }
  }
  return processed
}
