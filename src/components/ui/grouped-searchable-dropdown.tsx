"use client"

import React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export type BaseSearchableOption = { value: string | number; label: string };
export type HealthcareProviderOption = BaseSearchableOption & { type: 'healthcare_provider'; specialty?: string };
export type ClinicOption = BaseSearchableOption & { type: 'clinic'; description?: string };
export type GenericOption = BaseSearchableOption & { type?: undefined; description?: string; specialty?: string };
export type SearchableDropdownOption = HealthcareProviderOption | ClinicOption | GenericOption;

export interface SearchableDropdownGroup {
  title: string
  options: SearchableDropdownOption[]
}

export interface GroupedSearchableDropdownProps {
  groups: SearchableDropdownGroup[]
  value?: string | number
  placeholder?: string
  onSelect: (option: SearchableDropdownOption) => void
  onChange?: (value: string) => void
  filterFunction?: (option: SearchableDropdownOption, searchTerm: string) => boolean
  renderOption?: (option: SearchableDropdownOption) => React.ReactNode
  className?: string
  inputClassName?: string
  dropdownClassName?: string
  emptyMessage?: string
  disabled?: boolean
}

export const GroupedSearchableDropdown = React.forwardRef<HTMLInputElement, GroupedSearchableDropdownProps>(
  ({
    groups,
    value,
    placeholder = "Search...",
    onSelect,
    onChange,
    filterFunction,
    renderOption,
    className,
    inputClassName,
    dropdownClassName,
    emptyMessage = "No options found",
    disabled = false,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [displayValue, setDisplayValue] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const prevValueRef = React.useRef<string | number | undefined>(value)
    const isFirstRender = React.useRef(true)

    const defaultFilterFunction = React.useCallback(
      (option: SearchableDropdownOption, term: string) => {
        return option.label.toLowerCase().includes(term.toLowerCase())
      },
      []
    )

    const finalFilterFunction = filterFunction || defaultFilterFunction

    const filteredGroups = React.useMemo(() => {
      if (!searchTerm) return groups

      return groups.map(group => ({
        ...group,
        options: group.options.filter(option => finalFilterFunction(option, searchTerm))
      })).filter(group => group.options.length > 0)
    }, [groups, searchTerm, finalFilterFunction])

    const totalFilteredOptions = React.useMemo(() => {
      return filteredGroups.reduce((total, group) => total + group.options.length, 0)
    }, [filteredGroups])

    React.useEffect(() => {
      if (isFirstRender.current || prevValueRef.current !== value) {
        isFirstRender.current = false
        prevValueRef.current = value

        if (value !== undefined && value !== null) {
          const selectedOption = groups.flatMap(g => g.options).find(option => option.value === value)
          if (selectedOption) {
            setDisplayValue(selectedOption.label)
            setSearchTerm(selectedOption.label)
          } else if (typeof value === 'string' && value !== '') {
            setDisplayValue(value)
            setSearchTerm(value)
          }
        } else if (value === '' || value === null || value === undefined) {
          setDisplayValue("")
          setSearchTerm("")
        }
      }
    }, [value, groups])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      prevValueRef.current = newValue
      setSearchTerm(newValue)
      setDisplayValue(newValue)

      // Call the external onChange handler if provided
      onChange?.(newValue)

      if (!isOpen && newValue) {
        setIsOpen(true)
      }
    }

    const handleInputBlur = () => {
      // Close dropdown when input loses focus
      setTimeout(() => {
        setIsOpen(false)
      }, 150)

      // When input loses focus, update the form with the current display value
      if (onChange && displayValue !== value) {
        prevValueRef.current = displayValue
        onChange(displayValue)
      }
    }

    const handleOptionSelect = (option: SearchableDropdownOption) => {
      const newDisplayValue = option.label
      prevValueRef.current = newDisplayValue
      setDisplayValue(newDisplayValue)
      setSearchTerm(newDisplayValue)
      setIsOpen(false)

      // Call onSelect immediately to update the form
      onSelect(option)
    }

    const handleInputClick = () => {
      if (!disabled && !isOpen) {
        setIsOpen(true)
      }
    }

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && event.target instanceof Node &&
          !containerRef.current.contains(event.target)) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      } else if (e.key === "Tab") {
        // Close dropdown when Tab key is pressed
        setIsOpen(false)
      } else if (e.key === "Enter" && !isOpen) {
        e.preventDefault()
        if (onChange && displayValue !== value) {
          prevValueRef.current = displayValue
          onChange(displayValue)
        }
      }
    }

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(inputClassName)}
          autoComplete="off"
          {...props}
        />

        {isOpen && !disabled && (
          <div
            className={cn(
              "absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
              dropdownClassName
            )}
          >
            {totalFilteredOptions === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-1">
                {filteredGroups.map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`} className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 rounded-sm mb-1">
                      {group.title}
                    </div>
                    {group.options.map((option, index) => (
                      <div
                        key={`${group.title}-${option.value}-${index}`}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ml-2"
                        onClick={() => handleOptionSelect(option)}
                      >
                        {renderOption ? renderOption(option) : option.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

GroupedSearchableDropdown.displayName = "GroupedSearchableDropdown"
