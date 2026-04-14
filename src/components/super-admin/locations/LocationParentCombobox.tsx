"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { cn } from "@lib/utils";

export interface LocationOption {
  code: string;
  label: string;
  description?: string;
}

interface LocationParentComboboxProps {
  value: string;
  onSelect: (code: string) => void;
  options: LocationOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  isLoading?: boolean;
  onSearchChange?: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

export function LocationParentCombobox({
  value,
  onSelect,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  isLoading = false,
  onSearchChange,
  disabled = false,
  className,
}: LocationParentComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.code === value);
  const displayLabel = selectedOption
    ? selectedOption.description
      ? `${selectedOption.label} (${selectedOption.description})`
      : selectedOption.label
    : value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={`${option.label} ${option.description ?? ""} ${option.code}`}
                      onSelect={() => {
                        onSelect(option.code);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{option.label}</span>
                      {option.description && (
                        <span className="ml-2 text-xs text-muted-foreground shrink-0">
                          {option.description}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
