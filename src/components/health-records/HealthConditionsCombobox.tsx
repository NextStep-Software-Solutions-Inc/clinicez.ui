'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getHealthConditionsAction } from '@/actions/health-records/get-health-conditions.action'
import { matchesSearch } from '@/lib/search-utils'

interface HealthCondition {
  id: number
  name: string
  usageCount?: number
}

interface ConditionWithDetails {
  conditionId: number
  details?: string | null
}

interface HealthConditionsComboboxProps {
  value: ConditionWithDetails[]
  onChange: (conditions: ConditionWithDetails[]) => void
  disabled?: boolean
  maxDisplayBadges?: number
}

/**
 * HealthConditionsCombobox - Multi-select combobox for health conditions
 * Features:
 * - Searchable dropdown with most-used conditions first
 * - Checkbox selection for multiple conditions
 * - Shows selected conditions as badges
 * - Allows adding details for each condition
 */
export function HealthConditionsCombobox({
  value,
  onChange,
  disabled = false,
  maxDisplayBadges = 4,
}: HealthConditionsComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [topConditions, setTopConditions] = useState<HealthCondition[]>([])
  const [otherConditions, setOtherConditions] = useState<HealthCondition[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch health conditions on mount and keep synced
  useEffect(() => {
    if (topConditions.length === 0 && otherConditions.length === 0) {
      fetchConditions()
    }
  }, [])

  // Also fetch when popover opens if not already loaded
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
      toast.error('Failed to load health conditions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const allConditions = [...topConditions, ...otherConditions]

  const filteredTopConditions = topConditions.filter((c) =>
    matchesSearch(c.name, searchTerm)
  )

  const filteredOtherConditions = otherConditions.filter((c) =>
    matchesSearch(c.name, searchTerm)
  )

  const toggleCondition = (conditionId: number) => {
    const isSelected = value.some((c) => c.conditionId === conditionId)

    if (isSelected) {
      // Remove condition
      onChange(value.filter((c) => c.conditionId !== conditionId))
    } else {
      // Add condition
      onChange([
        ...value,
        {
          conditionId,
          details: undefined,
        },
      ])
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
    <div className="space-y-4">
      {/* Selected Badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {displayedBadges.map((cond) => (
            <Badge key={cond.conditionId} variant="secondary" className="pl-2">
              {getConditionName(cond.conditionId)}
              <button
                onClick={() => removeCondition(cond.conditionId)}
                className="ml-1 text-xs hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="outline">+{hiddenCount} more</Badge>
          )}
        </div>
      )}

      {/* Combobox Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            {value.length === 0 ? 'Select conditions...' : `${value.length} condition(s) selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search conditions..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              disabled={isLoading}
            />

            <CommandList className="max-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : filteredTopConditions.length === 0 && filteredOtherConditions.length === 0 ? (
                <CommandEmpty>No conditions found</CommandEmpty>
              ) : (
                <>
                  {/* Frequently Used Section */}
                  {filteredTopConditions.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Frequently Used
                      </div>
                      {filteredTopConditions.map((condition) => {
                        const isSelected = value.some((c) => c.conditionId === condition.id)
                        return (
                          <div
                            key={condition.id}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => toggleCondition(condition.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(e) => {
                                // Event is already handled by parent onClick
                                // This handler is here only for accessibility
                              }}
                              className="mr-2"
                            />
                            <span className="flex-1">{condition.name}</span>
                            {condition.usageCount && condition.usageCount > 0 && (
                              <span className="text-xs text-gray-500">
                                ({condition.usageCount})
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Other Conditions Section */}
                  {filteredOtherConditions.length > 0 && (
                    <>
                      {filteredTopConditions.length > 0 && (
                        <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
                      )}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Other Conditions
                      </div>
                      {filteredOtherConditions.map((condition) => {
                        const isSelected = value.some((c) => c.conditionId === condition.id)
                        return (
                          <div
                            key={condition.id}
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                            onClick={() => toggleCondition(condition.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(e) => {
                                // Event is already handled by parent onClick
                                // This handler is here only for accessibility
                              }}
                              className="mr-2"
                            />
                            <span className="flex-1">{condition.name}</span>
                          </div>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Details Fields for Selected Conditions */}
      {value.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="text-sm font-medium">Add Details</h4>
          {value.map((cond) => (
            <div key={cond.conditionId} className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
                {getConditionName(cond.conditionId)}
              </label>
              <Input
                placeholder="e.g., Diagnosed age 45, currently on medication..."
                value={cond.details || ''}
                onChange={(e) => updateConditionDetails(cond.conditionId, e.target.value)}
                maxLength={500}
                disabled={disabled}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Add relevant details such as onset age, current treatment, or severity
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
