"use server"

import { withErrorHandling } from "@/lib/with-error-handling"
import prisma from "@/lib/prisma"
import { downloadEKASAction } from "./download-ekas.action"
import JSZip from "jszip"

/**
 * Download EKAS forms in bulk for a date range
 * Returns a ZIP file containing all EKAS PDFs
 */
export const bulkDownloadEKASAction = withErrorHandling(
  async (
    clinicId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ message: string; data: { zipData: string; filename: string } }> => {
    // Get all consultation tickets within date range for this clinic
    const consultationTickets = await prisma.consultationTicket.findMany({
      where: {
        clinicId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
        Appointment: {
          Requesters: {
            some: {
              User: {
                isActive: true,
                deletedAt: null,
              }
            }
          }
        }
      },
      select: {
        id: true,
        caseNumber: true,
        Appointment: {
          select: {
            Requesters: {
              select: {
                userId: true,
                User: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (consultationTickets.length === 0) {
      throw new Error("No consultation tickets found for the selected date range")
    }

    // Create ZIP file
    const zip = new JSZip()
    const errors: string[] = []

    // Generate EKAS for each consultation ticket
    for (const ticket of consultationTickets) {
      const requester = ticket.Appointment?.Requesters[0]
      if (!requester) continue

      const userId = requester.userId
      const patientName = `${requester.User.lastName}, ${requester.User.firstName}`

      try {
        // Generate EKAS PDF
        const result = await downloadEKASAction(String(userId), ticket.id, clinicId)

        if (result.data) {
          // Convert base64 to buffer
          const pdfBuffer = Buffer.from(result.data.pdfData, 'base64')

          // Add to ZIP with sanitized filename
          const sanitizedName = patientName.replace(/[^a-z0-9]/gi, '_')
          const filename = `EKAS_${ticket.caseNumber || ticket.id}_${sanitizedName}.pdf`
          zip.file(filename, pdfBuffer)
        }
      } catch (error) {
        errors.push(`Failed to generate EKAS for ${patientName} (Case: ${ticket.caseNumber || ticket.id})`)
        console.error(`Error generating EKAS for ticket ${ticket.id}:`, error)
      }
    }

    // Check if we have any PDFs
    const files = Object.keys(zip.files)
    if (files.length === 0) {
      throw new Error("Failed to generate any EKAS forms. Please check the error logs.")
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipBase64 = zipBuffer.toString('base64')

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    const zipFilename = `Bulk_EKAS_${startDateStr}_to_${endDateStr}.zip`

    let message = `Successfully generated ${files.length} EKAS form(s)`
    if (errors.length > 0) {
      message += `. ${errors.length} form(s) failed to generate.`
    }

    return {
      message,
      data: {
        zipData: zipBase64,
        filename: zipFilename
      }
    }
  }
)
