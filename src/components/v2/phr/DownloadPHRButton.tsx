'use client'

import { useState } from 'react'
import { FileText, Loader2, Palette, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { PHR_SECTIONS, type PHRSectionId, type PHRTheme } from './phr-sections'

interface DownloadPHRButtonProps {
  /** API endpoint that returns PDF
   *  Patient dashboard: '/api/phr/patient'
   *  Clinic dashboard:  '/api/phr/clinic/[clinicUid]/patients/[patientId]'
   */
  printHref: string
  /** Full name of the patient, used in the downloaded filename */
  patientName?: string
  /** Button label. Defaults to "Download PHR" */
  label?: string
  /** Additional className for the trigger button */
  className?: string
}

const DEFAULT_BUTTON_CLASS =
  'flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shrink-0'

export function DownloadPHRButton({ printHref, patientName, label = 'Download PHR', className }: DownloadPHRButtonProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<PHRSectionId>>(
    new Set(PHR_SECTIONS.map(s => s.id))
  )
  const [theme, setTheme] = useState<PHRTheme>('colorful')
  const [downloading, setDownloading] = useState(false)

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

  async function downloadPdf() {
    setDownloading(true)
    try {
      const params = new URLSearchParams({ sections: sectionsParam(), theme })
      const response = await fetch(`${printHref}?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to download PHR: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const date = new Date()
      const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
      const safeName = patientName ? `_${patientName.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
      link.download = `PHR${safeName}_${timestamp}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setOpen(false)
    } catch (error) {
      console.error('Failed to download PHR:', error)
      // Could show a toast notification here
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? DEFAULT_BUTTON_CLASS}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </button>

      {/* ── Section Selection ── */}
      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false) }}>
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={downloadPdf}
              disabled={selected.size === 0 || downloading}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
