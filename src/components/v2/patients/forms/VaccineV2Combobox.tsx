'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Vaccine {
  id: number
  name: string
}

interface VaccineV2ComboboxProps {
  value: string | number
  onChange: (vaccineId: string) => void
  vaccines: Vaccine[]
  placeholder?: string
  disabled?: boolean
}

export function VaccineV2Combobox({
  value,
  onChange,
  vaccines = [],
  placeholder = 'Select vaccine...',
  disabled = false,
}: VaccineV2ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset search term when opening
  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  const selectedVaccine = useMemo(() => {
    return vaccines.find((v) => String(v.id) === String(value))
  }, [vaccines, value])

  const filteredVaccines = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return vaccines.filter((v) => v.name.toLowerCase().includes(term))
  }, [vaccines, searchTerm])

  const handleSelect = (id: number) => {
    onChange(String(id))
    setSearchTerm('')
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full justify-between h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-normal hover:bg-slate-50 dark:hover:bg-slate-900 transition-all focus:ring-1 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
      >
        <span className={cn('truncate', !selectedVaccine && 'text-slate-400 dark:text-slate-550')}>
          {selectedVaccine ? selectedVaccine.name : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-450"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-55" />
          </motion.div>
        </div>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10">
              <Input
                placeholder="Search vaccine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-7 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="max-h-[200px] overflow-y-auto p-1.5 space-y-0.5">
              {filteredVaccines.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                  No matching vaccines found
                </div>
              ) : (
                filteredVaccines.map((vaccine) => {
                  const isSelected = String(value) === String(vaccine.id)
                  return (
                    <button
                      key={vaccine.id}
                      type="button"
                      onClick={() => handleSelect(vaccine.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-900",
                        isSelected && "bg-teal-50/50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold"
                      )}
                    >
                      <span>{vaccine.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-500 shrink-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
