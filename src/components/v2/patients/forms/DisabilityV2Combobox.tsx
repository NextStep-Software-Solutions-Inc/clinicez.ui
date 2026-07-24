'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Check, ChevronsUpDown, X, Loader2, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { getDisabilitiesAction } from '@/actions/disability/get-disabilities.action'
import { createDisabilityAction } from '@/actions/disability/create-disability.action'

interface DisabilityV2ComboboxProps {
  value: string
  onChange: (disability: string) => void
  existingDisabilities?: string[]
  placeholder?: string
  disabled?: boolean
}

export function DisabilityV2Combobox({
  value,
  onChange,
  existingDisabilities = [],
  placeholder = 'Select or type disability...',
  disabled = false,
}: DisabilityV2ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [disabilities, setDisabilities] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch disabilities when popover opens
  useEffect(() => {
    if (open && disabilities.length === 0) {
      fetchDisabilities()
    }
  }, [open, disabilities.length])

  // Reset search term when popover opens
  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  const fetchDisabilities = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDisabilitiesAction()
      if (result.success && result.data) {
        setDisabilities(result.data)
      } else {
        toast.error(result.error || 'Failed to load disabilities')
      }
    } catch (err) {
      console.error('[FETCH_DISABILITIES_ERROR]', err)
      toast.error(getActionErrorMessage(err, 'Failed to load disabilities'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const filteredDisabilities = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return disabilities.filter(
      (d) =>
        d.name.toLowerCase().includes(term) &&
        !existingDisabilities.some((e) => e.toLowerCase() === d.name.toLowerCase())
    )
  }, [disabilities, searchTerm, existingDisabilities])

  const isExactMatch = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    return (
      term.length > 0 &&
      disabilities.some((d) => d.name.toLowerCase() === term)
    )
  }, [disabilities, searchTerm])

  const isNewDisability = searchTerm.trim().length > 0 && !isExactMatch

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
    setSearchTerm('')
  }

  const handleCreateNew = async () => {
    const trimmed = searchTerm.trim()
    if (!trimmed) return

    setIsCreating(true)
    try {
      const result = await createDisabilityAction(trimmed)
      if (result.success && result.data) {
        toast.success(`Created disability: ${result.data.name}`)
        setDisabilities((prev) => [...prev, result.data!])
        onChange(result.data.name)
        setOpen(false)
        setSearchTerm('')
      } else {
        toast.error(result.error || 'Failed to create disability')
      }
    } catch (err) {
      console.error('[CREATE_DISABILITY_ERROR]', err)
      toast.error(getActionErrorMessage(err, 'Failed to create disability'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full flex items-center justify-between px-3 h-9 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-normal hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-all focus:ring-1 focus:ring-teal-500 outline-none text-slate-800 dark:text-slate-200"
          >
            <span className={cn('truncate text-slate-800 dark:text-slate-200', !value && 'text-slate-400 dark:text-slate-550')}>
              {value || placeholder}
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
                className="text-slate-400"
              >
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-55" />
              </motion.div>
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-xl overflow-hidden z-[100]"
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10">
            <Input
              placeholder="Search or type new disability..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500"
              autoFocus
            />
          </div>

          <div className="max-h-[220px] overflow-y-auto p-1.5 space-y-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-450">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-teal-500" />
                <span className="text-xs">Loading disabilities...</span>
              </div>
            ) : (
              <>
                {filteredDisabilities.length === 0 && !isNewDisability && (
                  <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                    No matching disabilities found
                  </div>
                )}

                {filteredDisabilities.map((disability) => {
                  const isSelected = value === disability.name
                  return (
                    <button
                      key={disability.id}
                      type="button"
                      onClick={() => handleSelect(disability.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-900",
                        isSelected && "bg-teal-50/50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 font-semibold"
                      )}
                    >
                      <span>{disability.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-500 shrink-0" />}
                    </button>
                  )
                })}

                {isNewDisability && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="w-full flex items-center gap-2 px-2.5 py-2 mt-1 rounded-lg text-left text-xs border border-dashed border-teal-200 dark:border-teal-900 bg-teal-50/25 dark:bg-teal-950/10 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all group"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500" />
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">Creating disability...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 text-teal-500 transition-transform group-hover:scale-110" />
                        <div className="truncate">
                          <span className="text-teal-600 dark:text-teal-400 font-bold">Create disability:</span>
                          <span className="text-slate-700 dark:text-slate-300 ml-1 italic">"{searchTerm}"</span>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
