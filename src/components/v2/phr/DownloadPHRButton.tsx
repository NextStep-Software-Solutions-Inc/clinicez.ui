'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
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

export function DownloadPHRButton({ printHref, label = 'Download PHR', className }: DownloadPHRButtonProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<PHRSectionId>>(
    new Set(PHR_SECTIONS.map(s => s.id))
  )

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

  function handleDownload() {
    const sectionsParam = selected.size === PHR_SECTIONS.length
      ? 'all'
      : Array.from(selected).join(',')

    const url = sectionsParam
      ? `${printHref}?sections=${encodeURIComponent(sectionsParam)}`
      : printHref

    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? DEFAULT_BUTTON_CLASS}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
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
                <div key={section.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => toggle(section.id)}>
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
              onClick={handleDownload}
              disabled={selected.size === 0}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Open &amp; Print / Save PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
