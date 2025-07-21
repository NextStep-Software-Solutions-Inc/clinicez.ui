import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Checkbox } from "./ui/checkbox";

interface MultiSelectProps<T> {
  options: T[];
  value: number[];
  onChange: (value: number[]) => void;
  placeholder?: string;
  fallbackMessage?: string;
  disabled?: boolean;
}

export default function MultiSelect<T extends { id: number; name: string; description?: string }>({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  fallbackMessage = "No options available",
  disabled = false
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = options.filter(option => value.includes(option.id));

  const handleSelect = (optionId: number) => {
    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  const handleRemove = (optionId: number) => {
    onChange(value.filter(id => id !== optionId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              selectedOptions.map((option) => (
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
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search diagnostics..." />
          <CommandList>
            <CommandEmpty>{fallbackMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => handleSelect(option.id)}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={value.includes(option.id)}
                    className="mr-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}