'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/action-error'
import { getHealthConditionsAction } from '@/actions/health-records/get-health-conditions.action'

interface HealthCondition {
  id: number
  name: string
  usageCount?: number
}

interface ConditionWithDetails {
  conditionId: number
  details?: string | null
}

interface HealthConditionsV2ComboboxProps {
  value: ConditionWithDetails[]
  onChange: (conditions: ConditionWithDetails[]) => void
  disabled?: boolean
  maxDisplayBadges?: number
}

export function HealthConditionsV2Combobox({
  value,
  onChange,
  disabled = false,
  maxDisplayBadges = 4,
}: HealthConditionsV2ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [topConditions, setTopConditions] = useState<HealthCondition[]>([])
  const [otherConditions, setOtherConditions] = useState<HealthCondition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
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

  // Fetch health conditions on mount
  useEffect(() => {
    if (topConditions.length === 0 && otherConditions.length === 0) {
      fetchConditions()
    }
  }, [])

  // Refetch when popover opens if empty
  useEffect(() => {
    if (open && topConditions.length === 0 && otherConditions.length === 0) {
      fetchConditions()
    }
  }, [open, topConditions.length, otherConditions.length])

  const fetchConditions = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getHealthConditionsAction()
      if (result.success && result.topConditions && result.otherConditions !== undefined) {
        setTopConditions(result.topConditions)
        setOtherConditions(result.otherConditions)
      } else {
        toast.error(result.error || 'Failed to load health conditions')
      }
    } catch (err) {
      console.error('Error fetching conditions:', err)
      toast.error(getActionErrorMessage(err, 'Failed to load health conditions'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const allConditions = useMemo(() => [...topConditions, ...otherConditions], [topConditions, otherConditions])

  const normalizedSearch = searchTerm.toLowerCase().trim()

  const filteredTopConditions = useMemo(() => 
    topConditions.filter(c => c.name.toLowerCase().includes(normalizedSearch)),
    [topConditions, normalizedSearch]
  )

  const filteredOtherConditions = useMemo(() => 
    otherConditions.filter(c => c.name.toLowerCase().includes(normalizedSearch)),
    [otherConditions, normalizedSearch]
  )

  const toggleCondition = (conditionId: number) => {
    const isSelected = value.some((c) => c.conditionId === conditionId)
    if (isSelected) {
      onChange(value.filter((c) => c.conditionId !== conditionId))
    } else {
      onChange([...value, { conditionId, details: undefined }])
    }
  }

  const updateConditionDetails = (conditionId: number, details: string) => {
    onChange(
      value.map((c) =>
        c.conditionId === conditionId
          ? { ...c, details: details || null }
          : c
      )
    )
  }

  const removeCondition = (conditionId: number) => {
    onChange(value.filter((c) => c.conditionId !== conditionId))
  }

  const getConditionName = (conditionId: number) => {
    return allConditions.find((c) => c.id === conditionId)?.name || 'Unknown'
  }

  const displayedBadges = value.slice(0, maxDisplayBadges)
  const hiddenCount = Math.max(0, value.length - maxDisplayBadges)

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Selected Badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayedBadges.map((cond) => (
            <Badge
              key={cond.conditionId}
              variant="secondary"
              className="pl-2.5 pr-1.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 text-teal-700 dark:text-teal-400 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>{getConditionName(cond.conditionId)}</span>
              <button
                type="button"
                onClick={() => removeCondition(cond.conditionId)}
                className="p-0.5 rounded-full hover:bg-teal-500/20 text-teal-650 dark:text-teal-450 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline" className="text-xs py-1 rounded-lg">
              +{hiddenCount} more
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown Selector */}
      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 h-9 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-normal hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-all focus:ring-1 focus:ring-teal-500 outline-none text-slate-800 dark:text-slate-200"
        >
          <span>
            {value.length === 0 ? 'Select conditions...' : `${value.length} condition(s) selected`}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-405 ml-2"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-55" />
          </motion.div>
        </button>

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
                  placeholder="Search health conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500"
                  autoFocus
                />
              </div>

              <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-1 text-xs">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-450">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-teal-500" />
                    <span>Loading conditions...</span>
                  </div>
                ) : filteredTopConditions.length === 0 && filteredOtherConditions.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                    No matching conditions found
                  </div>
                ) : (
                  <>
                    {/* Frequently Used Section */}
                    {filteredTopConditions.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Frequently Used
                        </div>
                        {filteredTopConditions.map((condition) => {
                          const isSelected = value.some((c) => c.conditionId === condition.id)
                          return (
                            <button
                              key={condition.id}
                              type="button"
                              onClick={() => toggleCondition(condition.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                                isSelected && "bg-teal-50/20 dark:bg-teal-950/10"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCondition(condition.id)}
                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              />
                              <span className={cn("flex-1", isSelected && "font-semibold text-teal-650 dark:text-teal-400")}>
                                {condition.name}
                              </span>
                              {condition.usageCount && condition.usageCount > 0 && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-full font-bold">
                                  {condition.usageCount}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Other Conditions Section */}
                    {filteredOtherConditions.length > 0 && (
                      <div className="space-y-0.5 pt-1">
                        {filteredTopConditions.length > 0 && (
                          <div className="my-1.5 border-t border-slate-100 dark:border-slate-850" />
                        )}
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Other Conditions
                        </div>
                        {filteredOtherConditions.map((condition) => {
                          const isSelected = value.some((c) => c.conditionId === condition.id)
                          return (
                            <button
                              key={condition.id}
                              type="button"
                              onClick={() => toggleCondition(condition.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors",
                                isSelected && "bg-teal-50/20 dark:bg-teal-950/10"
                              )}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCondition(condition.id)}
                                className="border-slate-300 dark:border-slate-700 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              />
                              <span className={cn("flex-1", isSelected && "font-semibold text-teal-650 dark:text-teal-400")}>
                                {condition.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Details Fields for Selected Conditions */}
      {value.length > 0 && (
        <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
          <h4 className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">
            Add Diagnosed Details
          </h4>
          <div className="space-y-3">
            {value.map((cond) => (
              <div key={cond.conditionId} className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/10">
                <label className="text-xs font-bold text-slate-750 dark:text-slate-300 block">
                  {getConditionName(cond.conditionId)}
                </label>
                <Input
                  placeholder="e.g., Diagnosed age 45, currently on medication..."
                  value={cond.details || ''}
                  onChange={(e) => updateConditionDetails(cond.conditionId, e.target.value)}
                  maxLength={500}
                  disabled={disabled}
                  className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
