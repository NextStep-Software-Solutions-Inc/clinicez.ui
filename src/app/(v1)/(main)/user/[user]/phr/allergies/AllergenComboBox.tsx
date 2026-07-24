
"use client";

import { getAllergensAction } from "@actions/allergen.action";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import {  FormControl } from "@components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import Each from "@components/utils/Each";
import { cn } from "@lib/utils";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React, { useEffect } from "react";

interface AllergenComboBoxProps {
    value: string;
    onChange: (value: string) => void;
  }
  
export const AllergenComboBox = ({value, onChange}: AllergenComboBoxProps) => {
  const [allergens, setAllergens] = React.useState<string[]>([])
  const [allergenInput, setAllergenInput] = React.useState(value)
  const [open, setOpen] = React.useState(false)
  
  useEffect(() => {
    (async () => {
      const allergens = await getAllergensAction()
      await setAllergens(() => allergens.map(({name}) => name))
    })()
  }, [])
    
  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setAllergenInput(value)
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
            {value? value : "Select allergen"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search allergen..." onValueChange={setAllergenInput} />
          <CommandEmpty asChild>
            <Button className="m-1 font-normal" size="sm" variant="ghost"
              onClick={() =>{
                onChange(allergenInput)
                setOpen(false)
              }}
            >
              <Plus className="w-4 h-4 mr-1"/>
                Add 
              <span className="font-bold px-1">{allergenInput}</span>
                as new allergen
            </Button>
          </CommandEmpty>
          <CommandList>
            <Each
              of={allergens}
              fallback={null}
              render={(allergen) => (
                <CommandItem
                  value={allergen}
                  key={allergen}
                  onSelect={() => {
                    onChange(allergen)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      allergen === value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {allergen}
                </CommandItem>
              )}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
