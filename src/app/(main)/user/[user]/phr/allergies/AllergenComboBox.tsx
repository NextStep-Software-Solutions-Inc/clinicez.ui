
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
import { useForm } from "react-hook-form";

interface AllergenComboBoxProps {
    value: string;
    onChange: (value: string) => void;
  }
  
export const AllergenComboBox = ({value, onChange}: AllergenComboBoxProps) => {
  const [allergens, setAllergens] = React.useState<string[]>([])
  
  const [open, setOpen] = React.useState(false)
  const form = useForm({
    defaultValues: {
      allergen: value
    }
  })
  
  useEffect(() => {
    (async () => {
      const allergens = await getAllergensAction()
      await setAllergens(() => allergens.map(({name}) => name))
    })()
  }, [])
    
  const allergen = form.watch("allergen")
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className=" p-0">
        <Command>
          <CommandInput placeholder="Search allergen..." onValueChange={value => form.setValue("allergen", value)} />
          <CommandEmpty asChild>
            <Button className="m-1 font-normal" size="sm" variant="ghost"
              onClick={() =>{
                onChange(allergen)
                setOpen(false)
              }}
            >
              <Plus className="w-4 h-4 mr-1"/>
                Add 
              <span className="font-bold px-1">{allergen}</span>
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