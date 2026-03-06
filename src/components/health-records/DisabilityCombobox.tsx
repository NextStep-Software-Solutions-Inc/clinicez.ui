'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronsUpDown, X, Loader2 } from 'lucide-react'
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
import { getActionErrorMessage } from '@/lib/action-error'
import { getDisabilitiesAction, type GetDisabilitiesResult } from '@/actions/disability/get-disabilities.action'
import { createDisabilityAction } from '@/actions/disability/create-disability.action'

interface DisabilityComboboxProps {
  value: string
  onChange: (disability: string) => void
  existingDisabilities?: string[]
  placeholder?: string
  disabled?: boolean
}

/**
 * DisabilityCombobox - Searchable disability selector with create capability
 * Features:
 * - Searchable dropdown with existing disabilities
 * - Create new disabilities on the fly
 * - Type-ahead search
 */
export function DisabilityCombobox({
  value,
  onChange,
  existingDisabilities = [],
  placeholder = 'Select or type disability...',
  disabled = false,
}: DisabilityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [disabilities, setDisabilities] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch disabilities on mount and when popover opens
  useEffect(() => {
    if (open && disabilities.length === 0) {
      fetchDisabilities()
    }
  }, [open, disabilities.length])

  // Reset search term when popover opens to allow fresh typing
  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  const fetchDisabilities = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDisabilitiesAction()
      if (result.success) {
        setDisabilities(result.data)
      } else {
        toast.error(result.error || 'Failed to load disabilities')
      }
    } catch (err) {
      console.error('[DISABILITY_COMBOBOX_ERROR]', err)
      toast.error(getActionErrorMessage(err, 'Failed to load disabilities'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Normalize search term for consistent comparisons
  const normalizedSearch = searchTerm.toLowerCase().trim()

  // Check if current search exactly matches an existing disability
  const hasExactMatch = disabilities.some(d => d.name.toLowerCase() === normalizedSearch)
  const isAlreadyAdded = existingDisabilities.some(existing => existing.toLowerCase() === normalizedSearch)

  // Show filtered disabilities that INCLUDE the search term (for suggestions)
  const filteredDisabilities = useMemo(
    () =>
      disabilities.filter(
        (disability) =>
          disability.name.toLowerCase().includes(normalizedSearch) &&
          !existingDisabilities.some(existing => existing.toLowerCase() === disability.name.toLowerCase())
      ),
    [disabilities, normalizedSearch, existingDisabilities]
  )

  // Show "Create new" button if:
  // 1. User has typed something
  // 2. It doesn't exactly match any existing disability
  // 3. It's not already in the user's disabilities
  const isNewDisability = normalizedSearch.length > 0 && !hasExactMatch && !isAlreadyAdded

  const handleSelect = (disabilityName: string) => {
    onChange(disabilityName)
    setSearchTerm('')
    setOpen(false)
  }

  const handleCreateNew = async () => {
    const trimmedTerm = normalizedSearch
    if (!trimmedTerm) {
      toast.error('Please enter a disability name')
      return
    }

    try {
      setIsLoading(true)
      const result = await createDisabilityAction(trimmedTerm)

      if (result.success && result.data) {
        // Add the newly created disability to the list if not already there
        const disabilityExists = disabilities.some(d => d.id === result.data.id)
        if (!disabilityExists) {
          setDisabilities(prev => [...prev, { id: result.data.id, name: result.data.name }])
        }

        toast.success(`Disability "${result.data.name}" created successfully`)
        onChange(result.data.name)
        setSearchTerm('')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to create disability')
      }
    } catch (err) {
      console.error('[CREATE_DISABILITY_ERROR]', err)
      toast.error(getActionErrorMessage(err, 'Failed to create disability'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setSearchTerm('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type new disability..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <CommandList>
                {/* Only show empty state if no filters, no matches, and no create option */}
                {filteredDisabilities.length === 0 && !isNewDisability && disabilities.length > 0 && (
                  <CommandEmpty>
                    <div className="p-2 text-center text-sm text-slate-500">
                      No disabilities found
                    </div>
                  </CommandEmpty>
                )}

                {disabilities.length === 0 && (
                  <CommandEmpty>
                    <div className="p-2 text-center text-sm text-slate-500">
                      No disabilities available
                    </div>
                  </CommandEmpty>
                )}

                {/* Existing Disabilities - shown when they match the search */}
                {filteredDisabilities.map((disability) => (
                  <CommandItem
                    key={`disability-${disability.id}`}
                    value={disability.name}
                    onSelect={() => handleSelect(disability.name)}
                  >
                    <span className="flex-1">{disability.name}</span>
                    {value === disability.name && (
                      <span className="text-purple-600 dark:text-purple-400">✓</span>
                    )}
                  </CommandItem>
                ))}

                {/* Create New Option - Show when input doesn't match any existing disability */}
                {isNewDisability && (
                  <CommandItem
                    key="create-new"
                    value={normalizedSearch}
                    onSelect={handleCreateNew}
                    disabled={isLoading}
                    className="bg-purple-50 dark:bg-purple-950/20 border-t border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex-1">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            Creating disability...
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            ✨ Create new disability
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 ml-2 font-semibold">
                            "{normalizedSearch}"
                          </span>
                        </>
                      )}
                    </span>
                  </CommandItem>
                )}
              </CommandList>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
