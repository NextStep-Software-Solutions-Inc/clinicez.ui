"use client"

import { Button } from "@components/ui/button"
import { Download } from "lucide-react"
import { downloadSAPAction } from "@/actions/phr/download-sap.action"
import { toast } from "sonner"

interface DownloadSAPButtonProps {
  userId: string
  patientName?: string
  consultationTicketId?: number
  clinicId?: number
}

export function DownloadSAPButton({ userId, patientName, consultationTicketId, clinicId }: DownloadSAPButtonProps) {
  const handleDownload = async () => {
    await toast.promise(
      downloadSAPAction(userId, consultationTicketId, clinicId),
      {
        loading: `Generating SAP form for ${patientName || 'patient'}...`,
        success: (result) => {
          if (result.data) {
            const link = document.createElement('a')
            link.href = `data:application/pdf;base64,${result.data.pdfData}`
            link.download = result.data.filename
            link.click()
          }
          return result.message
        },
        error: (err) => err.message || 'Failed to generate SAP form'
      }
    )
  }

  return (
    <Button onClick={handleDownload} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      SAP
    </Button>
  )
}
