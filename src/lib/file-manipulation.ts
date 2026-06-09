import heic2any from "heic2any";

function uniqueFileName(originalName: string) {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${baseName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
}

export const renameFile = (file: File): File => {
  const formattedName = uniqueFileName(file.name);
  return new File([file], formattedName, {
    type: file.type,
    lastModified: file.lastModified,
  });
};

export const heic2Jpeg = async (image: File): Promise<File> => {
  const blob = await heic2any({
    blob: image,
    toType: "image/jpeg",
    quality: 0.8,
  }) as Blob;

  return formatFileName(blob, image.name);
};

/**
 * Returns true for HEIC / HEIF files regardless of whether the browser
 * populates file.type (many do not for these proprietary formats).
 */
export const isHeicFile = (file: File): boolean => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    (type === "" && (name.endsWith(".heic") || name.endsWith(".heif")))
  );
};

/**
 * Common `accept` string for patient file upload inputs.
 * Covers images (including HEIC), PDFs and common document formats.
 */
export const PATIENT_FILE_ACCEPT =
  "image/*,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip";

export const formatFileName = (blob: Blob, originalName: string): File => {
  const formattedName = uniqueFileName(originalName);
  return new File([blob], formattedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};

const allowedTypes = [{
  type: "image/jpeg",
  extensions: [".jpg", ".jpeg"],
}, {
  type: "image/png",
  extensions: [".png"],
}, {
  type: "image/gif",
  extensions: [".gif"],
}, {
  type: "application/pdf",
  extensions: [".pdf"],
}, {
  type: "image/x-eps",
  extensions: [".eps"],
}, {
  type: "image/heic",
  extensions: [".heic", ".heif"],
}];

export const validateFileType = (file: File): boolean => {
  const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
  return allowedTypes.some(({ type, extensions }) =>
    file.type === type && extensions.includes(`.${fileExtension}`)
  );
}

// Typesafe CSV export function
export type TabularExportRow = Record<string, string | number | boolean | null | undefined>

export type CSVExportData = TabularExportRow
export type XLSXExportData = TabularExportRow

interface CSVExportOptions {
  filename?: string
  includeHeaders?: boolean
  delimiter?: string
}

export const exportCSV = (
  columns: string[],
  data: CSVExportData[],
  options: CSVExportOptions = {}
): void => {
  const {
    filename = `export_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
    includeHeaders = true,
    delimiter = ","
  } = options

  try {
    // Sanitize and escape CSV values
    const sanitizeValue = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return ""

      const stringValue = String(value)
      // Escape quotes and handle special characters
      if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvRows: string[] = []

    // Add headers if enabled
    if (includeHeaders) {
      csvRows.push(columns.map(col => sanitizeValue(col)).join(delimiter))
    }

    // Add data rows
    data.forEach(row => {
      const values = columns.map(col => sanitizeValue(row[col]))
      csvRows.push(values.join(delimiter))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Failed to export CSV:', error)
    throw new Error('CSV export failed')
  }
}

interface XLSXExportOptions {
  filename?: string
  includeHeaders?: boolean
  sheetName?: string
}

export const exportXLSX = async (
  columns: string[],
  data: XLSXExportData[],
  options: XLSXExportOptions = {}
): Promise<void> => {
  const {
    filename = `export_${new Date().toISOString().split('T')[0]}_${Date.now()}`,
    includeHeaders = true,
    sheetName = "Report"
  } = options

  try {
    const XLSX = await import("xlsx");

    const sanitizeValue = (value: string | number | boolean | null | undefined): string | number => {
      if (value === null || value === undefined) return ""
      if (typeof value === "number") return Number.isFinite(value) ? value : ""
      if (typeof value === "boolean") return value ? "Yes" : "No"
      return value
    }

    const rows: Array<Array<string | number>> = []

    if (includeHeaders) {
      rows.push(columns)
    }

    data.forEach(row => {
      const values = columns.map(column => {
        const value = sanitizeValue(row[column])
        return typeof value === "number" ? value : String(value)
      })
      rows.push(values)
    })

    const worksheet = XLSX.utils.aoa_to_sheet(rows)

    const dataRows = includeHeaders ? rows.slice(1) : rows
    const columnWidths = columns.map((column, columnIndex) => {
      const maxContentLength = Math.max(
        column.length,
        ...dataRows.map(row => {
          const cellValue = row[columnIndex]
          if (cellValue === undefined || cellValue === null) return 0
          return cellValue.toString().length
        }),
      )

      return { wch: Math.min(Math.max(maxContentLength + 2, 10), 80) }
    })

    worksheet["!cols"] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const resolvedFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
    XLSX.writeFile(workbook, resolvedFilename, { bookType: "xlsx" })

  } catch (error) {
    console.error('Failed to export XLSX:', error)
    throw new Error('XLSX export failed')
  }
}
