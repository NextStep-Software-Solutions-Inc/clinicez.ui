"use client"

import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { downloadPMRFAction } from "@/actions/phr/download-pmrf.action"
import { downloadPPCFAction } from "@/actions/phr/download-ppcf.action"
import { downloadPKRFAction } from "@/actions/phr/download-pkrf.action"
import { downloadHAFAction } from "@/actions/phr/download-haf.action"
import { Button } from "../ui/button"
import { Download, DownloadIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toBlobDownload } from '@/lib/utils/download'

interface DownloadPHRFormsProps {
  userId: string;
}

const DownloadPHRForms: React.FC<DownloadPHRFormsProps> = ({ userId }) => {
  const handlePMRFDownload = async () => {
    toast.promise(promiseWrapper(downloadPMRFAction)(userId), {
      loading: "Generating PhilHealth Member Registration Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "PMRF downloaded successfully"
      },
      error: "Unable to generate PMRF. Please check your profile information and try again.",
    })
  }

  const handlePPCFDownload = async () => {
    toast.promise(promiseWrapper(downloadPPCFAction)(userId), {
      loading: "Generating PhilHealth Photo Consent Form...",
      success: async (res) => {
        const data = res.data
        if (!data?.pdfData) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename || 'PPCF_Form.pdf')
        return 'PPCF downloaded successfully'
      },
      error: "Unable to generate PPCF. Please check your profile information and try again."
    })
  }

  const handlePKRFDownload = async () => {
    toast.promise(promiseWrapper(downloadPKRFAction)(userId), {
      loading: "Generating PhilHealth Konsulta Registration Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "PKRF downloaded successfully"
      },
      error: "Unable to generate PKRF. Please check your profile information and try again."
    })
  }

  const handleHAFDownload = async () => {
    toast.promise(promiseWrapper(downloadHAFAction)(userId), {
      loading: "Generating PhilHealth Health Assessment Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "HAF downloaded successfully"
      },
      error: "Unable to generate HAF. Please check your profile information and try again.",
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Download PHR Forms
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePMRFDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download PMRF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePPCFDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download PPCF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePKRFDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download PKRF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleHAFDownload}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Download Health Assessment Form
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DownloadPHRForms
