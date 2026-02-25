'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Eye, FileText, Loader2, Palette } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PHR_SECTIONS, type PHRSectionId, type PHRTheme } from './phr-sections'

interface DownloadPHRButtonProps {
  /** URL of the HTML print/preview page (for the in-app iframe preview).
   *  Patient dashboard: '/v2/patient/phr/print'
   *  Clinic dashboard:  '/v2/clinic/[clinicUid]/patients/[patientId]/phr/print'
   */
  printHref: string
  /** URL of the PDF download API route.
   *  Patient dashboard: '/api/phr/download'
   *  Clinic dashboard:  '/api/phr/clinic/[clinicUid]/patients/[patientId]/download'
   */
  downloadApiHref: string
  /** Button label. Defaults to "Download PHR" */
  label?: string
  /** Additional className for the trigger button */
  className?: string
}

const DEFAULT_BUTTON_CLASS =
  'flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 shadow-lg'

type Step = 'select' | 'preview'

export function DownloadPHRButton({ printHref, downloadApiHref, label = 'Download PHR', className }: DownloadPHRButtonProps) {
  const [step, setStep] = useState<Step>('select')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<PHRSectionId>>(
    new Set(PHR_SECTIONS.map(s => s.id))
  )
  const [iframeLoading, setIframeLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(false)
  const [theme, setTheme] = useState<PHRTheme>('colorful')

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

  function sectionsParam(): string {
    return selected.size === PHR_SECTIONS.length
      ? 'all'
      : Array.from(selected).join(',')
  }

  function buildPreviewUrl(): string {
    const params = new URLSearchParams({ sections: sectionsParam(), preview: '1', theme })
    return `${printHref}?${params.toString()}`
  }

  function buildDownloadUrl(): string {
    return `${downloadApiHref}?sections=${encodeURIComponent(sectionsParam())}&theme=${theme}`
  }

  function handlePreview() {
    setIframeLoading(true)
    setStep('preview')
  }

  async function handleDownload() {
    setDownloading(true)
    setDownloadError(false)
    try {
      const response = await fetch(buildDownloadUrl())
      if (!response.ok) throw new Error('PDF generation failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = response.headers.get('content-disposition')
      const match = cd?.match(/filename="([^"]+)"/)
      a.download = match?.[1] ?? 'PHR.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch {
      setDownloadError(true)
    } finally {
      setDownloading(false)
    }
  }

  function handleClose() {
    setOpen(false)
    setDownloadError(false)
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
            {/* ── Theme picker ── */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <Palette className="w-3.5 h-3.5" />
                Style
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('colorful')}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors ${
                    theme === 'colorful'
                      ? 'border-teal-600 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-teal-500" />
                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                    <span className="h-3 w-3 rounded-full bg-teal-300" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Colorful</span>
                  <span className="text-[10px] text-slate-400 leading-tight">ClinicEZ teal branding</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('minimal')}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors ${
                    theme === 'minimal'
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="h-3 w-3 rounded-full bg-slate-800" />
                    <span className="h-3 w-3 rounded-full bg-slate-400" />
                    <span className="h-3 w-3 rounded-full bg-slate-200" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Minimal</span>
                  <span className="text-[10px] text-slate-400 leading-tight">Clean, low-ink monochrome</span>
                </button>
              </div>
            </div>

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
            {downloadError && (
              <p className="text-xs text-red-600 flex-1 self-center">PDF generation failed. Please try again.</p>
            )}
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handlePreview}
              disabled={selected.size === 0}
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleDownload}
              disabled={selected.size === 0 || downloading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? 'Generating…' : 'Download PDF'}
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
              {theme === 'minimal' && (
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Minimal</span>
              )}
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
                onClick={handleDownload}
                disabled={downloading}
                className="bg-white text-teal-700 hover:bg-teal-50 h-8 px-3 gap-1.5 font-semibold"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{downloading ? 'Generating…' : 'Download PDF'}</span>
              </Button>
            </div>
          </div>

          {/* Preview iframe — fixed A4 width (794 px) with explicit horizontal scroll */}
          <div className="relative flex-1 overflow-x-auto overflow-y-auto bg-slate-100">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                <p className="text-sm text-slate-500 font-medium">Loading preview…</p>
              </div>
            )}
            <iframe
              src={buildPreviewUrl()}
              className="h-full border-0"
              style={{ width: '794px', minWidth: '794px', display: 'block' }}
              title="PHR Preview"
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50 shrink-0 rounded-b-lg">
            {downloadError
              ? <p className="text-xs text-red-600">PDF generation failed. Please try again.</p>
              : <p className="text-xs text-slate-500">
                  This is a read-only preview. Click <strong>Download PDF</strong> to save the file.
                </p>
            }
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-4 gap-1.5"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? 'Generating…' : 'Download PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
