import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "./ui/command";
import { Checkbox } from "./ui/checkbox";

// Generic SmartMultiSelectProps
interface SmartMultiSelectProps<T, IDType = number> {
  value: IDType[];
  onChange: (value: IDType[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  searchPlaceholder?: string;
  minSearchLength?: number;
  // New props for genericity:
  search: (query: string) => Promise<T[]>;
  fetchByIds: (ids: IDType[]) => Promise<T[]>;
  getId: (item: T) => IDType;
  renderItem: (item: T) => React.ReactNode;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SmartMultiSelect<T, IDType = number>({
  value,
  onChange,
  placeholder = "Select items...",
  disabled = false,
  maxDisplayItems = 3,
  searchPlaceholder = "Search items...",
  minSearchLength = 2,
  search,
  fetchByIds,
  getId,
  renderItem
}: SmartMultiSelectProps<T, IDType>) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const lastValueRef = useRef<IDType[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load selected items data when value changes
  useEffect(() => {
    const loadSelectedItems = async () => {
      // Check if value has actually changed
      const hasValueChanged = value.length !== lastValueRef.current.length ||
        value.some((id, index) => id !== lastValueRef.current[index]);

      if (!hasValueChanged) {
        return;
      }

      lastValueRef.current = [...value];

      if (value.length === 0) {
        setSelectedItems([]);
        return;
      }

      // Check if we already have the selected items to avoid unnecessary refetches
      const currentIds = selectedItems.map(item => getId(item));
      const hasAllItems = value.length === currentIds.length &&
        value.every(id => currentIds.includes(id));

      if (hasAllItems) {
        return;
      }

      try {
        setIsLoadingSelected(true);
        const result = await fetchByIds(value);
        setSelectedItems(result);
      } catch (error) {
        console.error("Error loading selected items:", error);
        setSelectedItems([]); // Clear on error to prevent stale state
      } finally {
        setIsLoadingSelected(false);
      }
    };

    loadSelectedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // fetchByIds and getId are stable from parent component

  // Search for items when search term changes
  useEffect(() => {
    const searchItems = async () => {
      if (debouncedSearchTerm.length < minSearchLength) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const result = await search(debouncedSearchTerm);
        setSearchResults(result);
      } catch (error) {
        console.error("Error searching items:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, minSearchLength]); // search is stable from parent component

  // Handle option selection/deselection
  const handleSelect = useCallback((item: T) => {
    const itemId = getId(item);
    const newValue = value.includes(itemId)
      ? value.filter((id: IDType) => id !== itemId)
      : [...value, itemId];
    onChange(newValue);
  }, [value, onChange, getId]);

  // Handle removing a selected option
  const handleRemove = useCallback((itemId: IDType) => {
    onChange(value.filter((id: IDType) => id !== itemId));
  }, [value, onChange]);

  // Handle popover open/close
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setSearchTerm("");
      setSearchResults([]);
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, []);

  // Selected IDs set for performance
  const selectedIdsSet = useMemo(() => new Set(value), [value]);

  // Display options (search results or prompt to search)
  const displayOptions = useMemo(() => {
    if (debouncedSearchTerm.length < minSearchLength) {
      return [];
    }
    return searchResults;
  }, [searchResults, debouncedSearchTerm.length, minSearchLength]);

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
            {isLoadingSelected ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading...</span>
              </div>
            ) : selectedItems.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedItems.slice(0, maxDisplayItems).map((item) => (
                  <Badge
                    key={String(getId(item))}
                    variant="secondary"
                    className="text-xs"
                  >
                    {renderItem(item)}
                    <span
                      className="ml-1 hover:bg-muted rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(getId(item));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedItems.length > maxDisplayItems && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedItems.length - maxDisplayItems} more
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
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {debouncedSearchTerm.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search
              </CommandEmpty>
            ) : searchTerm !== debouncedSearchTerm && searchTerm.length >= minSearchLength ? (
              <CommandEmpty>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              </CommandEmpty>
            ) : isSearching ? (
              <CommandEmpty>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              </CommandEmpty>
            ) : displayOptions.length === 0 ? (
              <CommandEmpty>No items found</CommandEmpty>
            ) : (
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {displayOptions.map((item) => (
                  <div
                    key={String(getId(item))}
                    className="flex items-center px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelect(item)}
                  >
                    <Checkbox
                      checked={selectedIdsSet.has(getId(item))}
                      className="mr-2"
                      onCheckedChange={() => handleSelect(item)}
                    />
                    <div className="flex-1">
                      {renderItem(item)}
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
