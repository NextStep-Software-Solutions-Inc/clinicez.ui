"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// Directly import the unified JSON dictionary
import philhealthMedicines from "@/lib/philhealth-yakap/philhealth-medicines.json";

export type PhilHealthMedicine = {
  drugCode: string;
  description: string;
  genericCode: string;
  genericName: string;
  saltCode: string;
  saltName: string;
  formCode: string;
  formName: string;
  strengthCode: string;
  strengthName: string;
  unitCode: string;
  unitName: string;
  packageCode: string;
  packageName: string;
  category: string;
};

// Represents a manual/custom entry
export type CustomMedicine = {
  isCustom: true;
  customName: string;
};

export type MedicineSelection = PhilHealthMedicine | CustomMedicine | null;

interface MedicinePhilHealthComboboxProps {
  value: MedicineSelection;
  onChange: (med: MedicineSelection) => void;
  className?: string;
  disabled?: boolean;
}

export default function MedicinePhilHealthCombobox({
  value,
  onChange,
  className,
  disabled = false,
}: MedicinePhilHealthComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Only show top 50 matches to keep the UI snappy
  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return philhealthMedicines.slice(0, 50);
    const lowerQ = searchQuery.toLowerCase();
    return philhealthMedicines
      .filter((m) => m.description.toLowerCase().includes(lowerQ))
      .slice(0, 50);
  }, [searchQuery]);

  const displayValue = useMemo(() => {
    if (!value) return "Search PhilHealth database...";
    if ("isCustom" in value) return value.customName;
    return value.description;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal text-left px-3", className, !value && "text-muted-foreground")}
        >
          <span className="truncate flex-1">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] sm:w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search drug name..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px]">
            {/* Custom Entry Option */}
            {searchQuery && (
              <CommandGroup heading="Custom Entry">
                <CommandItem
                  value={searchQuery}
                  onSelect={(currentValue) => {
                    onChange({ isCustom: true, customName: currentValue });
                    setOpen(false);
                  }}
                  className="font-medium text-primary"
                >
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Add "{searchQuery}" as Other Medicine
                </CommandItem>
              </CommandGroup>
            )}

            {/* Dictionary Matches */}
            <CommandGroup heading="PhilHealth Database">
              {filteredMedicines.length === 0 && !searchQuery ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Type to search...</div>
              ) : filteredMedicines.length === 0 ? (
                <CommandEmpty>No medicine found in dictionary.</CommandEmpty>
              ) : (
                filteredMedicines.map((med) => {
                  const isSelected = value && !("isCustom" in value) && value.drugCode === med.drugCode;
                  return (
                    <CommandItem
                      key={med.drugCode}
                      value={med.description}
                      onSelect={() => {
                        onChange(med as PhilHealthMedicine);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="font-medium truncate">{med.description}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex gap-2 pl-6 mt-0.5">
                        {med.genericName && <span>Gen: {med.genericName}</span>}
                        {med.formName && <span>Form: {med.formName}</span>}
                      </div>
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PlusCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
