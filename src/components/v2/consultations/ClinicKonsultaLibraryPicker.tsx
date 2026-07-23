"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  searchClinicKonsultaTermSuggestionsAction,
  type SearchClinicKonsultaTermSuggestions,
} from "@/actions/clinics/konsulta-library.action";

type Suggestion = NonNullable<
  SearchClinicKonsultaTermSuggestions["data"]
>[number];

interface ClinicKonsultaLibraryPickerProps {
  clinicUid: string;
  domainKeys: string[];
  value?: string;
  placeholder: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  onSelect: (suggestion: Suggestion) => void;
}

export default function ClinicKonsultaLibraryPicker({
  clinicUid,
  domainKeys,
  value,
  placeholder,
  emptyMessage = "No matching internal terms found.",
  disabled = false,
  className,
  onSelect,
}: ClinicKonsultaLibraryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    startTransition(async () => {
      const result = await searchClinicKonsultaTermSuggestionsAction(clinicUid, {
        domainKeys,
        query,
      });

      if (result.status && result.data) {
        setSuggestions(result.data);
        return;
      }

      setSuggestions([]);
    });
  }, [clinicUid, domainKeys, open, query]);

  const selectedLabel = useMemo(
    () => value?.trim() || placeholder,
    [placeholder, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between gap-2 text-left font-normal",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {selectedLabel}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[420px] max-w-[calc(100vw-2rem)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search internal library..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isPending ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : suggestions.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              suggestions.map((suggestion) => (
                <CommandItem
                  key={`${suggestion.domainKey}-${suggestion.id}`}
                  value={`${suggestion.displayLabel} ${suggestion.internalCode ?? ""}`}
                  onSelect={() => {
                    onSelect(suggestion);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="items-start gap-3 py-3"
                >
                  <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{suggestion.displayLabel}</span>
                      {suggestion.internalCode && (
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.internalCode}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {suggestion.domainTitle}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.mappedReferenceCode
                        ? `Mapped to ${suggestion.mappedReferenceCode}${suggestion.mappedReferenceLabel ? ` — ${suggestion.mappedReferenceLabel}` : ""}`
                        : "Not yet mapped to a PhilHealth reference"}
                    </div>
                  </div>
                  {value && value === suggestion.displayLabel ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
