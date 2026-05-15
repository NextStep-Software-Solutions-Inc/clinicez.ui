'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const COMMON_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Spouse',
  'Daughter',
  'Son',
  'Girlfriend',
  'Boyfriend',
  'Friend',
  'Employer',
  'Colleague',
  'Aunt',
  'Uncle',
  'Cousin',
  'Grandparent',
  'In-law',
  'Guardian',
]

interface RelationshipComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RelationshipCombobox({
  value,
  onChange,
  placeholder = 'Select or type relationship...',
  disabled = false,
}: RelationshipComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const normalizedValue = value.trim().toLowerCase()

  const filteredRelationships = useMemo(() => {
    return COMMON_RELATIONSHIPS.filter(
      (rel) =>
        rel.toLowerCase().includes(normalizedSearch) &&
        rel.toLowerCase() !== normalizedValue
    )
  }, [normalizedSearch, normalizedValue])

  const hasExactMatch = COMMON_RELATIONSHIPS.some(
    (rel) => rel.toLowerCase() === normalizedValue
  )

  const isNewRelationship = normalizedSearch.length > 0 && !hasExactMatch

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setSearchTerm('')
    setOpen(false)
  }

  // Reset search term when popover opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className={cn(value ? 'text-slate-900 dark:text-white' : 'text-slate-500')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search relationships..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {filteredRelationships.length === 0 && !isNewRelationship && (
              <CommandEmpty>No relationships found.</CommandEmpty>
            )}
            {filteredRelationships.length > 0 && (
              <CommandGroup>
                {filteredRelationships.map((relationship) => (
                  <CommandItem
                    key={`rel-${relationship}`}
                    value={relationship}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.toLowerCase() === relationship.toLowerCase()
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {relationship}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isNewRelationship && (
              <CommandGroup>
                <CommandItem
                  key="create-new"
                  value={searchTerm}
                  onSelect={handleSelect}
                  className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
                >
                  <span className="text-amber-600 dark:text-amber-500 font-medium">
                    ✨ Create &ldquo;{searchTerm}&rdquo;
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
