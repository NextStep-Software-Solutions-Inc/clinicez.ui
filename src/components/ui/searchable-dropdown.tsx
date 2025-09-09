"use client"

import React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface SearchableDropdownOption {
  value: string | number
  label: string
  studentIds?: string[]
  [key: string]: unknown
}

export interface SearchableDropdownProps {
  options: SearchableDropdownOption[]
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

export const SearchableDropdown = React.forwardRef<HTMLInputElement, SearchableDropdownProps>(
  ({
    options,
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

    const defaultFilterFunction = React.useCallback(
      (option: SearchableDropdownOption, term: string) => {
        return option.label.toLowerCase().includes(term.toLowerCase())
      },
      []
    )

    const finalFilterFunction = filterFunction || defaultFilterFunction

    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options
      return options.filter(option => finalFilterFunction(option, searchTerm))
    }, [options, searchTerm, finalFilterFunction])

    React.useEffect(() => {
      if (value !== undefined) {
        const selectedOption = options.find(option => option.value === value)
        if (selectedOption) {
          setDisplayValue(selectedOption.label)
          setSearchTerm(selectedOption.label)
        } else if (typeof value === 'string') {
          setDisplayValue(value)
          setSearchTerm(value)
        } else {
          setDisplayValue("")
          setSearchTerm("")
        }
      }
    }, [value, options])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setSearchTerm(newValue)
      setDisplayValue(newValue)
      if (!isOpen && newValue) {
        setIsOpen(true)
      }

      if (onChange) {
        onChange(newValue)
      }
    }

    const handleOptionSelect = (option: SearchableDropdownOption) => {
      setDisplayValue(option.label)
      setSearchTerm(option.label)
      setIsOpen(false)
      onSelect(option)
    }

    const handleInputClick = () => {
      if (!disabled && !isOpen) {
        setIsOpen(true)
      }
    }

    const interactionRef = React.useRef(false);
    const handleInputBlur = () => {
      if (!interactionRef.current) {
        setIsOpen(false);
      }
      interactionRef.current = false;
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
      }
    }

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onBlur={handleInputBlur}
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
            onMouseDown={() => {
              interactionRef.current = true;
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-1">
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleOptionSelect(option)}
                  >
                    {renderOption ? renderOption(option) : option.label}
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

SearchableDropdown.displayName = "SearchableDropdown"
