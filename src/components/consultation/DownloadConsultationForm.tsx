"use client"

import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Download } from "lucide-react"
import { toBlobDownload } from '@/lib/utils/download'
import { downloadConsultationAction } from "@/actions/phr/download-consultation.action"

interface DownloadConsultationFormProps {
  userId: string;
  consultationTicketId: number;
}

const DownloadConsultationForm: React.FC<DownloadConsultationFormProps> = ({
  userId,
  consultationTicketId
}) => {
  const handleConsultationDownload = async () => {
    toast.promise(promiseWrapper(downloadConsultationAction)(userId, consultationTicketId), {
      loading: "Generating PhilHealth Consultation Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "Consultation Form downloaded successfully"
      },
      error: "Unable to generate Consultation Form. Please check your profile information and try again.",
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleConsultationDownload}
    >
      <Download className="h-4 w-4" />
      Download Consultation Form
    </Button>
  )
}

export default DownloadConsultationForm
