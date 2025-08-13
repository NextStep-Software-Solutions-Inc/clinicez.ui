"use client"

import React from "react"
import { promiseWrapper } from "@/lib/with-error-handling"
import { toast } from "sonner"
import { downloadPMRFAction } from "@/actions/phr/download-pmrf.action"
import { downloadPPCFAction } from "@/actions/phr/download-ppcf.action"
import { downloadPKRFAction } from "@/actions/phr/download-pkrf.action"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Button } from "../ui/button"
import { Download, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DownloadPMRFActionProps { userId: string; children?: React.ReactNode }

const toBlobDownload = (base64: string, filename: string) => {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const DownloadPMRFAction: React.FC<DownloadPMRFActionProps> = ({ userId, children }) => {
  const handlePMRFDownload = async () => {
    toast.promise(promiseWrapper(downloadPMRFAction)(userId), {
      loading: "Preparing PHR form for download...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data returned")
        toBlobDownload(data.pdfData, data.filename)
        return res.message
      },
      error: "Failed to download PHR form",
    })
  }

  const handlePPCFDownload = async () => {
    toast.promise(promiseWrapper(downloadPPCFAction)(userId), {
      loading: "Generating PPCF form...",
      success: async (res) => {
        const data = res.data
        if (!data?.pdfData) return res.message || "No PPCF data"
        toBlobDownload(data.pdfData, data.filename || 'PPCF_Form.pdf')
        return 'PPCF downloaded'
      },
      error: "Failed to generate PPCF"
    })
  }

  const handlePKRFDownload = async () => {
    toast.promise(promiseWrapper(downloadPKRFAction)(userId), {
      loading: "Preparing PKRF form...",
      success: async (res) => {
        const data = res.data
        if (!data) return res.message
        toBlobDownload(data.pdfData, data.filename)
        return res.message
      },
      error: "Failed to generate PKRF"
    })
  }

  const primaryButton = (
    <Button variant="outline" size="sm" className="gap-2" onClick={handlePMRFDownload}>
      <Download className="h-4 w-4" />
      Download PMRF
    </Button>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {children || primaryButton}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="More download options">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePPCFDownload}>Download PPCF</DropdownMenuItem>
                <DropdownMenuItem onClick={handlePKRFDownload}>Download PKRF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">Download Other PhilHealth Forms</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DownloadPMRFAction