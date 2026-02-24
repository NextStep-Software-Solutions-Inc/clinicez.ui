'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Eye, FileText, Loader2, Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PHR_SECTIONS, type PHRSectionId } from './phr-sections'

interface DownloadPHRButtonProps {
  /** The URL prefix for the print page (without query params).
   *  For the patient dashboard: '/v2/patient/phr/print'
   *  For the clinic dashboard: '/v2/clinic/[clinicUid]/patients/[patientId]/phr/print'
   */
  printHref: string
  /** Button label. Defaults to "Download PHR" */
  label?: string
  /** Additional className for the trigger button */
  className?: string
}

const DEFAULT_BUTTON_CLASS =
  'flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg'

type Step = 'select' | 'preview'

export function DownloadPHRButton({ printHref, label = 'Download PHR', className }: DownloadPHRButtonProps) {
  const [step, setStep] = useState<Step>('select')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<PHRSectionId>>(
    new Set(PHR_SECTIONS.map(s => s.id))
  )
  const [iframeLoading, setIframeLoading] = useState(true)

  function toggle(id: PHRSectionId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(PHR_SECTIONS.map(s => s.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  function buildUrl(preview: boolean): string {
    const sectionsParam = selected.size === PHR_SECTIONS.length
      ? 'all'
      : Array.from(selected).join(',')

    const params = new URLSearchParams({ sections: sectionsParam })
    if (preview) params.set('preview', '1')
    return `${printHref}?${params.toString()}`
  }

  function handlePreview() {
    setIframeLoading(true)
    setStep('preview')
  }

  function handlePrint() {
    window.open(buildUrl(false), '_blank', 'noopener,noreferrer')
  }

  function handleClose() {
    setOpen(false)
    // Reset to section selection for next open
    setTimeout(() => setStep('select'), 300)
  }

  return (
    <>
      <button
        onClick={() => { setStep('select'); setOpen(true) }}
        className={className ?? DEFAULT_BUTTON_CLASS}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* ── STEP 1: Section Selection ── */}
      <Dialog open={open && step === 'select'} onOpenChange={v => { if (!v) handleClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <DialogTitle>Download Comprehensive PHR</DialogTitle>
            </div>
            <DialogDescription>
              Select the sections to include in your Personal Health Record. All sections are included by default.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-500">
                {selected.size} of {PHR_SECTIONS.length} sections selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-teal-600 hover:underline font-medium"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:underline font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {PHR_SECTIONS.map(section => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={() => toggle(section.id)}
                >
                  <Checkbox
                    id={`phr-section-${section.id}`}
                    checked={selected.has(section.id)}
                    onCheckedChange={() => toggle(section.id)}
                    className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                  />
                  <Label
                    htmlFor={`phr-section-${section.id}`}
                    className="text-sm font-medium cursor-pointer leading-none"
                  >
                    {section.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handlePreview}
              disabled={selected.size === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── STEP 2: Preview Dialog ── */}
      <Dialog open={open && step === 'preview'} onOpenChange={v => { if (!v) handleClose() }}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-teal-600 text-white rounded-t-lg shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="font-semibold text-sm">PHR Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('select')}
                className="text-white hover:text-white hover:bg-teal-700 h-8 px-3 gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-white text-teal-700 hover:bg-teal-50 h-8 px-3 gap-1.5 font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / Save PDF</span>
              </Button>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="relative flex-1 overflow-hidden bg-slate-100">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-sm text-slate-500 font-medium">Loading preview…</p>
              </div>
            )}
            <iframe
              src={buildUrl(true)}
              className="w-full h-full border-0"
              title="PHR Preview"
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 shrink-0 rounded-b-lg">
            <p className="text-xs text-slate-500">
              This is a read-only preview. Use <strong>Print / Save PDF</strong> to download.
            </p>
            <Button
              onClick={handlePrint}
              className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-4 gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
