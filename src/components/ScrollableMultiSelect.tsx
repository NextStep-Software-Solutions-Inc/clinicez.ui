import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, X, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "./ui/command";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { searchImagingDiagnosticsAction, getImagingDiagnosticsByIdsAction } from "@/actions/clinics/clinical-record/optimized-diagnostics.action";

interface ImagingDiagnostic {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  isActive: boolean;
}

interface ScrollableMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  searchPlaceholder?: string;
  minSearchLength?: number;
  maxHeight?: string;
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

export default function ScrollableMultiSelect({
  value,
  onChange,
  placeholder = "Select diagnostics...",
  disabled = false,
  maxDisplayItems = 3,
  searchPlaceholder = "Search diagnostics...",
  minSearchLength = 2,
  maxHeight = "300px"
}: ScrollableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ImagingDiagnostic[]>([]);
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<ImagingDiagnostic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load selected diagnostics data when value changes
  useEffect(() => {
    const loadSelectedDiagnostics = async () => {
      if (value.length === 0) {
        setSelectedDiagnostics([]);
        return;
      }

      try {
        setIsLoadingSelected(true);
        const result = await getImagingDiagnosticsByIdsAction(value);
        if (result.data) {
          setSelectedDiagnostics(result.data);
        }
      } catch (error) {
        console.error("Error loading selected diagnostics:", error);
      } finally {
        setIsLoadingSelected(false);
      }
    };

    loadSelectedDiagnostics();
  }, [value]);

  // Search for diagnostics when search term changes
  useEffect(() => {
    const searchDiagnostics = async () => {
      if (debouncedSearchTerm.length < minSearchLength) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const result = await searchImagingDiagnosticsAction(debouncedSearchTerm, 50);
        if (result.data) {
          setSearchResults(result.data);
        }
      } catch (error) {
        console.error("Error searching diagnostics:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchDiagnostics();
  }, [debouncedSearchTerm, minSearchLength]);

  // Handle option selection/deselection
  const handleSelect = useCallback((diagnostic: ImagingDiagnostic) => {
    const newValue = value.includes(diagnostic.id)
      ? value.filter(id => id !== diagnostic.id)
      : [...value, diagnostic.id];
    onChange(newValue);
  }, [value, onChange]);

  // Handle removing a selected option
  const handleRemove = useCallback((diagnosticId: number) => {
    onChange(value.filter(id => id !== diagnosticId));
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
    if (searchTerm.length < minSearchLength) {
      return [];
    }
    return searchResults;
  }, [searchResults, searchTerm.length, minSearchLength]);

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
            ) : selectedDiagnostics.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedDiagnostics.slice(0, maxDisplayItems).map((diagnostic) => (
                  <Badge
                    key={diagnostic.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {diagnostic.name}
                    <span
                      className="ml-1 hover:bg-muted rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(diagnostic.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedDiagnostics.length > maxDisplayItems && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedDiagnostics.length - maxDisplayItems} more
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
            {searchTerm.length < minSearchLength ? (
              <CommandEmpty>
                Type at least {minSearchLength} characters to search
              </CommandEmpty>
            ) : isSearching ? (
              <CommandEmpty>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              </CommandEmpty>
            ) : displayOptions.length === 0 ? (
              <CommandEmpty>No diagnostics found</CommandEmpty>
            ) : (
              <ScrollArea className="h-[300px]">
                <CommandGroup>
                  {displayOptions.map((diagnostic) => (
                    <div
                      key={diagnostic.id}
                      className="flex items-center px-2 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleSelect(diagnostic)}
                    >
                      <Checkbox
                        checked={selectedIdsSet.has(diagnostic.id)}
                        className="mr-2"
                        onCheckedChange={() => handleSelect(diagnostic)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{diagnostic.name}</div>
                        {diagnostic.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {diagnostic.description}
                          </div>
                        )}
                        {diagnostic.category && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {diagnostic.category}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CommandGroup>
              </ScrollArea>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
