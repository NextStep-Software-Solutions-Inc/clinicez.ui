"use client"

import React from 'react'
import { promiseWrapper } from '@/lib/with-error-handling'
import { toast } from 'sonner'
import { downloadPPCFAction } from '@/actions/phr/download-ppcf.action'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'
import { toBlobDownload } from '@/lib/utils/download'

interface DownloadPPCFActionProps { userId?: string; children?: React.ReactNode }

const DownloadPPCFAction: React.FC<DownloadPPCFActionProps> = ({ userId, children }) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(downloadPPCFAction)(userId), {
      loading: 'Generating PPCF PDF...',
      success: async (res) => {
        const data = res.data
        if (!data?.pdfData) return res.message || 'No data generated'
        toBlobDownload(data.pdfData, data.filename || 'PPCF_Form.pdf')
        return 'PPCF downloaded'
      },
      error: 'Failed to generate PPCF form',
    })
  }

  const defaultButton = (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      Download PPCF
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
        <TooltipContent side="top">Download Photo Consent Form</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DownloadPPCFAction
