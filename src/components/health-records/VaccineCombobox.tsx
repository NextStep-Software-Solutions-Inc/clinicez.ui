'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface VaccineComboboxProps {
  value: string
  onChange: (vaccine: string) => void
  vaccines?: { id: number; name: string; type?: string; description?: string | null }[]
  placeholder?: string
  disabled?: boolean
}

/**
 * VaccineCombobox - Searchable vaccine selector (read-only, no create)
 * Features:
 * - Searchable dropdown with vaccines from database or provided list
 * - Type-ahead search
 * - No create new option
 */
export function VaccineCombobox({
  value,
  onChange,
  vaccines = [],
  placeholder = 'Search vaccine...',
  disabled = false,
}: VaccineComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Common and frequently used vaccines
  const commonVaccineNames = [
    'COVID-19 (Pfizer)',
    'COVID-19 (Moderna)',
    'COVID-19 (AstraZeneca)',
    'COVID-19 (Janssen)',
    'Influenza (Flu)',
    'MMR (Measles, Mumps, Rubella)',
    'DPT (Diphtheria, Pertussis, Tetanus)',
    'Hepatitis B',
    'Hepatitis A',
  ]

  // Use provided vaccines or fall back to common ones
  const vaccineList = vaccines.length > 0 
    ? vaccines.map(v => v.name)
    : [
        ...commonVaccineNames,
        'Polio',
        'Tetanus',
        'Varicella (Chickenpox)',
        'Pneumococcal',
        'Meningococcal',
        'HPV (Human Papillomavirus)',
        'Shingles (Zoster)',
        'Yellow Fever',
        'Typhoid',
        'Rabies',
        'Tuberculosis (BCG)',
      ]

  // Categorize vaccines
  const frequentVaccines = vaccineList.filter(v => commonVaccineNames.includes(v))
  const otherVaccines = vaccineList.filter(v => !commonVaccineNames.includes(v))

  // Normalize search term for consistent comparisons
  const normalizedSearch = searchTerm.toLowerCase().trim()

  // Show filtered vaccines - frequent first, then others
  const filteredFrequentVaccines = useMemo(
    () =>
      frequentVaccines.filter((vaccine) =>
        vaccine.toLowerCase().includes(normalizedSearch)
      ),
    [normalizedSearch, frequentVaccines]
  )

  const filteredOtherVaccines = useMemo(
    () =>
      otherVaccines.filter((vaccine) =>
        vaccine.toLowerCase().includes(normalizedSearch)
      ),
    [normalizedSearch, otherVaccines]
  )

  const handleSelect = (vaccineName: string) => {
    onChange(vaccineName)
    setSearchTerm('')
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setSearchTerm('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className={cn('truncate', !value && 'text-slate-500')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search vaccines..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filteredFrequentVaccines.length === 0 && filteredOtherVaccines.length === 0 ? (
            <CommandEmpty>
              <div className="p-2 text-center text-sm text-slate-500">
                No vaccines found
              </div>
            </CommandEmpty>
          ) : (
            <CommandList>
              {/* Frequent/Common Vaccines Section */}
              {filteredFrequentVaccines.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                    Frequent
                  </div>
                  {filteredFrequentVaccines.map((vaccine) => (
                    <CommandItem
                      key={vaccine}
                      value={vaccine}
                      onSelect={() => handleSelect(vaccine)}
                    >
                      <span className="flex-1">{vaccine}</span>
                      {value === vaccine && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </CommandItem>
                  ))}
                </>
              )}

              {/* Other Vaccines Section */}
              {filteredOtherVaccines.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20">
                    Other
                  </div>
                  {filteredOtherVaccines.map((vaccine) => (
                    <CommandItem
                      key={vaccine}
                      value={vaccine}
                      onSelect={() => handleSelect(vaccine)}
                    >
                      <span className="flex-1">{vaccine}</span>
                      {value === vaccine && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </CommandItem>
                  ))}
                </>
              )}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
