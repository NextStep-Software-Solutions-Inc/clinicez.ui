"use client"

import React from 'react'
import { promiseWrapper } from '@/lib/with-error-handling'
import { toast } from 'sonner'
import { downloadPPCFAction } from '@/actions/phr/download-ppcf.action'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'

interface DownloadPPCFActionProps { userId?: string; children?: React.ReactNode }

const toBlobDownload = (base64: string, filename: string) => {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

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
