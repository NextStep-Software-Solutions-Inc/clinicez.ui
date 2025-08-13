"use client"

import React from 'react'
import { promiseWrapper } from '@/lib/with-error-handling'
import { toast } from 'sonner'
import { downloadPKRFAction } from '@/actions/phr/download-pkrf.action'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Button } from '../ui/button'
import { Download } from 'lucide-react'

interface DownloadPKRFActionProps { userId: string; children?: React.ReactNode }

const toBlobDownload = (base64: string, filename: string) => {
  const bin = atob(base64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  const blob = new Blob([arr], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const DownloadPKRFAction: React.FC<DownloadPKRFActionProps> = ({ userId, children }) => {
  const handleDownload = async () => {
    toast.promise(promiseWrapper(downloadPKRFAction)(userId), {
      loading: 'Generating PKRF PDF...',
      success: async (res) => {
        const data = res.data
        if (!data?.pdfData) return res.message || 'No PKRF data'
        toBlobDownload(data.pdfData, data.filename || 'PKRF_Form.pdf')
        return 'PKRF downloaded'
      },
      error: 'Failed to generate PKRF form'
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
        <TooltipContent side="top">Download Konsulta Registration Form</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default DownloadPKRFAction
