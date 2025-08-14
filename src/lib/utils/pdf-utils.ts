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
  // Build the public URL for the PDF (works on Vercel and locally)
  const baseUrl =
    process.env.APP_BASE_URL ||
      process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.APP_BASE_URL;
  const pdfUrl = `${baseUrl}/pdfs/phr/${fileName}`;
  console.log(`Fetching PDF template from URL: ${pdfUrl}`);

  // Check cache first
  let bytes = templateCache.get(pdfUrl);
  if (!bytes) {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`PDF template not found at ${pdfUrl}`);
    }
    bytes = new Uint8Array(await response.arrayBuffer());
    templateCache.set(pdfUrl, bytes);
  }

  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  return { pdfDoc, form, bytes, filePath: pdfUrl };
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
