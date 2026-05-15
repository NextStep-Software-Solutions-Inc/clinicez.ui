
"use client";

import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import {  FormControl } from "@components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import ConditionalRender from "@components/utils/ConditionalRender";
import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React from "react";

interface ComboBoxProps {
    options?: string[];
    value: string;
    onChange: (value: string) => void;
}
  
export const ComboBox = ({value, onChange, options = []}: ComboBoxProps) => {
  
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  
  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setInputValue(value)
        }
      }}
    >
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground"
            )}
          >
            {value? value : "Select an option"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className=" p-0">
        <Command>
          <CommandInput placeholder="Enter to search or create" onValueChange={setInputValue} />
          <ConditionalRender condition={inputValue?.length > 0}>
            <CommandEmpty asChild>
              <Button className="m-1 font-normal" size="sm" variant="ghost"
                onClick={() =>{
                  onChange(inputValue)
                  setOpen(false)
                }}
              >
                <Plus className="w-4 h-4 mr-1"/>
                Add 
                <span className="font-bold px-1">{inputValue}</span>
                as new option
              </Button>
            </CommandEmpty>
          </ConditionalRender>
          <CommandList>
            <Each
              of={options}
              fallback={null}
              render={(option) => (
                <CommandItem
                  value={option}
                  key={option}
                  onSelect={() => {
                    onChange(option)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option === value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              )}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
