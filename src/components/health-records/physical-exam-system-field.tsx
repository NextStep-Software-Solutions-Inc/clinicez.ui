'use client'

import React, { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  parsePeCodes,
  formatPeCodes,
  togglePeFindingCode,
  isOthersCode,
} from '@/lib/physical-exam-utils'

export interface PhysicalExamLibraryOption {
  id: string
  code: string
  description: string
  isActive?: boolean
}

export interface PhysicalExamSystemFieldProps {
  category: string
  label: string
  value: string | string[] | null | undefined
  onChange: (value: string) => void
  remarks: string | null | undefined
  onRemarksChange: (remarks: string) => void
  options: PhysicalExamLibraryOption[]
  disabled?: boolean
  isSingleSelect?: boolean
  compact?: boolean
}

export function PhysicalExamSystemField({
  category,
  label,
  value,
  onChange,
  remarks,
  onRemarksChange,
  options,
  disabled = false,
  isSingleSelect = false,
  compact = false,
}: PhysicalExamSystemFieldProps) {
  const [open, setOpen] = useState(false)
  const selectedCodes = parsePeCodes(value)
  const hasOthers = selectedCodes.some(isOthersCode)

  const handleToggleCode = (code: string, description?: string) => {
    const updated = togglePeFindingCode(category, selectedCodes, code, description)
    onChange(formatPeCodes(updated))
  }

  const handleRemoveCode = (code: string, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = selectedCodes.filter((c) => c !== code)
    onChange(formatPeCodes(updated))
  }

  return (
    <div
      className={cn(
        'space-y-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-white/40 dark:bg-slate-900/10 shadow-sm transition-all',
        hasOthers && 'border-teal-200 dark:border-teal-900/40 bg-teal-50/10'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">{label}</h4>
        {hasOthers && (
          <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
            PESPECIFIC
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {/* Finding Selector */}
        <div className="space-y-1">
          <Label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {isSingleSelect ? 'Status' : 'Findings (Multi-Select Allowed)'}
          </Label>

          {isSingleSelect ? (
            <Select
              disabled={disabled}
              value={selectedCodes[0] || ''}
              onValueChange={(val) => onChange(val)}
            >
              <SelectTrigger className={cn('w-full text-xs focus:ring-teal-500', compact ? 'h-8' : 'h-9')}>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.code}>
                    {opt.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled}
                  className={cn(
                    'w-full justify-between h-auto min-h-8 py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850',
                    compact ? 'min-h-8 py-1' : 'min-h-9 py-1.5'
                  )}
                >
                  <div className="flex flex-wrap gap-1 items-center max-w-[calc(100%-20px)]">
                    {selectedCodes.length > 0 ? (
                      selectedCodes.map((code) => {
                        const opt = options.find((o) => o.code === code)
                        const displayText = opt ? opt.description : code
                        const isOther = isOthersCode(code)

                        return (
                          <Badge
                            key={code}
                            variant={isOther ? 'default' : 'secondary'}
                            className={cn(
                              'text-[10px] py-0 px-2 h-5 flex items-center gap-1 font-medium',
                              isOther && 'bg-teal-600 text-white hover:bg-teal-700'
                            )}
                          >
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">{displayText}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="hover:opacity-75 rounded-full cursor-pointer ml-0.5"
                              onPointerDown={(e) => handleRemoveCode(code, e)}
                              onClick={(e) => handleRemoveCode(code, e)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleRemoveCode(code, e as any)
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Select pertinent findings...
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] sm:w-[380px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search findings..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">
                      No findings found.
                    </CommandEmpty>
                    <CommandGroup className="max-h-56 overflow-y-auto">
                      {options.map((opt) => {
                        const isSelected = selectedCodes.includes(opt.code)
                        return (
                          <CommandItem
                            key={opt.id}
                            value={opt.description}
                            onSelect={() => handleToggleCode(opt.code, opt.description)}
                            className="text-xs cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex-1 mr-2">{opt.description}</span>
                            <Check
                              className={cn(
                                'h-3.5 w-3.5 text-teal-600 shrink-0',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Remarks Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label
              htmlFor={`${category}-remarks`}
              className={cn(
                'text-[10px] font-extrabold uppercase tracking-wider block',
                hasOthers
                  ? 'text-teal-600 dark:text-teal-400 font-black'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              {hasOthers ? 'Specific Details for Others (PESPECIFIC)' : 'Remarks'}
            </Label>
            {hasOthers && (
              <span className="text-[9px] text-teal-600 dark:text-teal-400 italic">
                Required for PhilHealth Others
              </span>
            )}
          </div>
          <Input
            id={`${category}-remarks`}
            disabled={disabled}
            value={remarks || ''}
            onChange={(e) => onRemarksChange(e.target.value)}
            className={cn(
              'text-xs focus-visible:ring-teal-500',
              compact ? 'h-8' : 'h-9',
              hasOthers && 'border-teal-400 focus-visible:ring-teal-500 bg-teal-50/20'
            )}
            placeholder={
              hasOthers
                ? 'Specify finding details (e.g., Pale nailbeds / Sunken eyeballs)...'
                : 'Additional details (optional)...'
            }
          />
        </div>
      </div>
    </div>
  )
}
