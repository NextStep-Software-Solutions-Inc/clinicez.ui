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
    // VERCEL_URL is automatically set by Vercel for both preview and production deployments
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

export interface RadioMapping {
  /** Base field name (e.g., "personalHistorySmoking") */
  field: string
  /** The option value (e.g., "Yes", "No", "Quit") */
  option: string | number | boolean
}

/**
 * Process radio buttons in a PDF form.
 * 
 * NOTE: This PDF has an unusual structure where each radio option is its own separate radio group.
 * For example, instead of one "personalHistorySmoking" group with options ["Yes", "No", "Quit"],
 * there are three separate radio groups: "personalHistorySmokingYes", "personalHistorySmokingNo", "personalHistorySmokingQuit"
 * 
 * To select an option, we:
 * 1. Construct the full field name by appending the option to the base field name
 * 2. Get that radio group
 * 3. Select it (typically using the first available option, which is often the field name itself)
 */
export async function processRadioButtons(form: ReturnType<PDFDocument["getForm"]>, mappings: RadioMapping[]): Promise<number> {
  let processed = 0
  for (const { field, option } of mappings) {
    if (!option) continue
    try {
      // The PDF has separate radio groups for each option (e.g., "personalHistorySmokingYes", "personalHistorySmokingNo")
      const optionStr = String(option)
      const radioFieldName = `${field}${optionStr}`

      const radioGroup = form.getRadioGroup(radioFieldName)
      const options = radioGroup.getOptions()

      if (options.length > 0) {
        // Select the first (and usually only) option in this radio group
        radioGroup.select(options[0])
        processed++
      } else {
        logger.warn(`Radio group "${radioFieldName}" has no options available`)
      }
    } catch (error: unknown) {
      logger.error(`Error processing radio button "${field}" with option "${option}":`, error)
    }
  }
  return processed
}
