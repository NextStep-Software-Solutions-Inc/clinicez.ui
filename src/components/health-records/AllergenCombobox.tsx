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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getAllergensAction, type GetAllergensResult } from '@/actions/allergen/get-allergens.action'
import { createAllergenAction } from '@/actions/allergen/create-allergen.action'

interface AllergenComboboxProps {
  value: string
  onChange: (allergen: string) => void
  existingAllergens?: string[]
  placeholder?: string
  disabled?: boolean
}

/**
 * AllergenCombobox - Searchable allergen selector with create capability
 * Features:
 * - Searchable dropdown with existing allergens
 * - Create new allergens on the fly
 * - Type-ahead search
 */
export function AllergenCombobox({
  value,
  onChange,
  existingAllergens = [],
  placeholder = 'Select or type allergen...',
  disabled = false,
}: AllergenComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [allergens, setAllergens] = useState<Array<{ id: number; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch allergens on mount and when popover opens
  useEffect(() => {
    if (open && allergens.length === 0) {
      fetchAllergens()
    }
  }, [open, allergens.length])

  // Reset search term when popover opens to allow fresh typing
  useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  const fetchAllergens = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAllergensAction()
      if (result.success) {
        setAllergens(result.data)
      } else {
        toast.error(result.error || 'Failed to load allergens')
      }
    } catch (err) {
      console.error('[ALLERGEN_COMBOBOX_ERROR]', err)
      toast.error('Failed to load allergens')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Normalize search term for consistent comparisons
  const normalizedSearch = searchTerm.toLowerCase().trim()

  // Check if current search exactly matches an existing allergen
  const hasExactMatch = allergens.some(a => a.name.toLowerCase() === normalizedSearch)
  const isAlreadyAdded = existingAllergens.some(existing => existing.toLowerCase() === normalizedSearch)

  // Show filtered allergens that INCLUDE the search term (for suggestions)
  const filteredAllergens = useMemo(() => 
    allergens.filter((allergen) =>
      allergen.name.toLowerCase().includes(normalizedSearch) &&
      !existingAllergens.some(existing => existing.toLowerCase() === allergen.name.toLowerCase())
    ),
    [allergens, normalizedSearch, existingAllergens]
  )

  // Show "Create new" button if:
  // 1. User has typed something
  // 2. It doesn't exactly match any existing allergen
  // 3. It's not already in the user's allergies
  // This allows creating "squids" even if "squid" exists
  const isNewAllergen = normalizedSearch.length > 0 && !hasExactMatch && !isAlreadyAdded

  const handleSelect = (allergenName: string) => {
    onChange(allergenName)
    setSearchTerm('')
    setOpen(false)
  }

  const handleCreateNew = async () => {
    const trimmedTerm = normalizedSearch
    if (!trimmedTerm) {
      toast.error('Please enter an allergen name')
      return
    }

    try {
      setIsLoading(true)
      const result = await createAllergenAction(trimmedTerm)

      if (result.success && result.data) {
        // Add the newly created allergen to the list if not already there
        const allergenExists = allergens.some(a => a.id === result.data.id)
        if (!allergenExists) {
          setAllergens(prev => [...prev, { id: result.data.id, name: result.data.name }])
        }

        toast.success(`Allergen "${result.data.name}" created successfully`)
        onChange(result.data.name)
        setSearchTerm('')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to create allergen')
      }
    } catch (err) {
      console.error('[CREATE_ALLERGEN_ERROR]', err)
      toast.error('Failed to create allergen')
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
            placeholder="Search or type new allergen..."
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
                {filteredAllergens.length === 0 && !isNewAllergen && allergens.length > 0 && (
                  <CommandEmpty>
                    <div className="p-2 text-center text-sm text-slate-500">
                      No allergens found
                    </div>
                  </CommandEmpty>
                )}

                {allergens.length === 0 && (
                  <CommandEmpty>
                    <div className="p-2 text-center text-sm text-slate-500">
                      No allergens available
                    </div>
                  </CommandEmpty>
                )}

                {/* Existing Allergens - shown when they match the search */}
                {filteredAllergens.map((allergen) => (
                  <CommandItem
                    key={`allergen-${allergen.id}`}
                    value={allergen.name}
                    onSelect={() => handleSelect(allergen.name)}
                  >
                    <span className="flex-1">{allergen.name}</span>
                    {value === allergen.name && (
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </CommandItem>
                ))}

                {/* Create New Option - Show when input doesn't match any existing allergen */}
                {isNewAllergen && (
                  <CommandItem 
                    key="create-new"
                    value={normalizedSearch}
                    onSelect={handleCreateNew}
                    disabled={isLoading}
                    className="bg-amber-50 dark:bg-amber-950/20 border-t border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex-1">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Creating allergen...
                          </span>
                        </span>
                      ) : (
                        <>
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            ✨ Create new allergen
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 ml-2 font-semibold">
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
