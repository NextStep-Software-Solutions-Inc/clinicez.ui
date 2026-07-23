"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { promiseWrapper } from "@/lib/with-error-handling"
import { downloadEKASAction } from "@/actions/phr/download-ekas.action"
import { toBlobDownload } from "@/lib/utils/download"

interface DownloadEKASButtonProps {
  userId: string
  consultationTicketId?: number | null
  clinicId?: number | null
  patientName?: string
}

export const DownloadEKASButton: React.FC<DownloadEKASButtonProps> = ({
  userId,
  consultationTicketId,
  clinicId,
  patientName
}) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(downloadEKASAction)(userId, consultationTicketId, clinicId), {
      loading: `Generating Electronic Yakap Availment Slip${patientName ? ` for ${patientName}` : ''}...`,
      success: async (res: { status: boolean; message: string; data: { pdfData: string; filename: string } | null }) => {
        if (!res?.data) throw new Error("No PDF data received from server")
        toBlobDownload(res.data.pdfData, res.data.filename)
        return "Electronic Yakap Availment Slip downloaded successfully"
      },
      error: "Unable to generate EKAS. Please check the patient's profile information and try again.",
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download EKAS
    </Button>
  )
}
