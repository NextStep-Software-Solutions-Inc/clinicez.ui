import React, { useState, useMemo, useCallback, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "./ui/command";
import { Checkbox } from "./ui/checkbox";
import { FixedSizeList as List } from "react-window";

interface VirtualizedMultiSelectProps<T> {
  options: T[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  fallbackMessage?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  itemHeight?: number;
  listHeight?: number;
}

interface OptionItemProps<T> {
  index: number;
  style: React.CSSProperties;
  data: {
    options: T[];
    selectedIds: Set<number>;
    onSelect: (id: number) => void;
  };
}

function OptionItem<T extends { id: number; name: string; description?: string }>({
  index,
  style,
  data
}: OptionItemProps<T>) {
  const { options, selectedIds, onSelect } = data;
  const option = options[index];

  const handleSelect = useCallback(() => {
    onSelect(option.id);
  }, [option.id, onSelect]);

  return (
    <div style={style}>
      <div
        className="flex items-center px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
        onClick={handleSelect}
      >
        <Checkbox
          checked={selectedIds.has(option.id)}
          className="mr-2"
          onCheckedChange={handleSelect}
        />
        <div className="flex-1">
          <div className="font-medium text-sm">{option.name}</div>
          {option.description && (
            <div className="text-xs text-muted-foreground truncate">
              {option.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VirtualizedMultiSelect<T extends { id: number; name: string; description?: string }>({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  fallbackMessage = "No options available",
  disabled = false,
  maxDisplayItems = 3,
  itemHeight = 56,
  listHeight = 300
}: VirtualizedMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Memoized filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;

    const term = searchTerm.toLowerCase();
    return options.filter(option =>
      option.name.toLowerCase().includes(term) ||
      (option.description && option.description.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  // Memoized selected options for display
  const selectedOptions = useMemo(() => {
    const selectedSet = new Set(value);
    return options.filter(option => selectedSet.has(option.id));
  }, [options, value]);

  // Memoized selected IDs set for performance
  const selectedIdsSet = useMemo(() => new Set(value), [value]);

  // Handle option selection/deselection
  const handleSelect = useCallback((optionId: number) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  }, [value, onChange]);

  // Handle removing a selected option
  const handleRemove = useCallback((optionId: number) => {
    onChange(value.filter(id => id !== optionId));
  }, [value, onChange]);

  // Handle popover open/close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setSearchTerm("");
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, []);

  // Prepare data for virtual list
  const listData = useMemo(() => ({
    options: filteredOptions,
    selectedIds: selectedIdsSet,
    onSelect: handleSelect
  }), [filteredOptions, selectedIdsSet, handleSelect]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplayItems).map((option) => (
                  <Badge
                    key={option.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {option.name}
                    <span
                      className="ml-1 hover:bg-muted rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(option.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedOptions.length > maxDisplayItems && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedOptions.length - maxDisplayItems} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        onWheel={(e) => {
          // Prevent wheel events from bubbling up to prevent issues with portals
          e.stopPropagation();
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            ref={searchInputRef}
            placeholder="Search diagnostics..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {filteredOptions.length === 0 ? (
              <CommandEmpty>{fallbackMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                <List
                  height={Math.min(listHeight, filteredOptions.length * itemHeight)}
                  width="100%"
                  itemCount={filteredOptions.length}
                  itemSize={itemHeight}
                  itemData={listData}
                  className="overflow-auto"
                >
                  {OptionItem}
                </List>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
