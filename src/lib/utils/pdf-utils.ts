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

export async function loadPhilHealthPdf(fileName: string): Promise<LoadPdfResult> {
  const filePath = path.resolve(process.cwd(), "pdfs", "phr", fileName)
  if (!fs.existsSync(filePath)) throw new Error(`${fileName} template not found at ${filePath}`)
  const raw = fs.readFileSync(filePath)
  const bytes = new Uint8Array(raw)
  const pdfDoc = await PDFDocument.load(bytes)
  const form = pdfDoc.getForm()
  return { pdfDoc, form, bytes, filePath }
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
    } catch { }
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
    } catch { }
  }
  return processed
}
