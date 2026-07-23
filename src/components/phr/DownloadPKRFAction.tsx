"use client"

import React from 'react'
import { promiseWrapper } from '@/lib/with-error-handling'
import { toast } from 'sonner'
import { downloadPKRFAction } from '@/actions/phr/download-pkrf.action'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'
import { toBlobDownload } from '@/lib/utils/download'

interface DownloadPKRFActionProps { userId: string; children?: React.ReactNode }

const DownloadPKRFAction: React.FC<DownloadPKRFActionProps> = ({ userId, children }) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(downloadPKRFAction)(userId), {
      loading: "Generating PhilHealth Yakap Registration Form...",
      success: async (res) => {
        const data = res.data
        if (!data) throw new Error("No PDF data received from server")
        toBlobDownload(data.pdfData, data.filename)
        return "PKRF downloaded successfully"
      },
      error: 'Unable to generate PKRF. Please check your profile information and try again.'
    })
  }

  const defaultButton = (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      Download PKRF
    </Button>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            {children || defaultButton}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">Download Yakap Registration Form</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DownloadPKRFAction
