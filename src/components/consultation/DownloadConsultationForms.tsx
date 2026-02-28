"use client"

import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { Download, DownloadIcon } from "lucide-react"
import { toBlobDownload } from '@/lib/utils/download'
import { downloadConsultationAction } from "@/actions/phr/download-consultation.action"
import { downloadSAPAction } from "@/actions/phr/download-sap.action"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DownloadConsultationFormsProps {
  userId: string
  consultationTicketId: number
  patientName?: string
}

const DownloadConsultationForms: React.FC<DownloadConsultationFormsProps> = ({
  userId,
  consultationTicketId,
  patientName
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

  const handleSAPDownload = async () => {
    toast.promise(promiseWrapper(downloadSAPAction)(userId, consultationTicketId), {
      loading: `Generating SAP form for ${patientName || 'patient'}...`,
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "SAP Form downloaded successfully"
      },
      error: "Unable to generate SAP form. Please try again.",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Download Forms
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleConsultationDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Consultation Form
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSAPDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          SAP Form
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DownloadConsultationForms
