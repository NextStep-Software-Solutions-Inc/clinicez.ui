"use client";

import React, { useCallback, useState, useEffect } from "react";
import SmartMultiSelect from "./SmartMultiSelect";
import {
  searchProceduresAction,
  getProceduresByIdsAction,
  createClinicProcedureAction,
  ProcedureType
} from "@/actions/clinics/clinical-record/procedures.action";
import { Button } from "./ui/button";
import { PlusCircle, ChevronsUpDown, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string;
  isClinicCustom: boolean;
  masterProcedureId: number | null;
}

interface ProcedureMultiSelectProps {
  value: number[];
  onChange: (value: number[]) => void;
  procedureType: ProcedureType;
  clinicId: number;
  placeholder?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
  searchPlaceholder?: string;
  minSearchLength?: number;
}

export default function ProcedureMultiSelect({
  value,
  onChange,
  procedureType,
  clinicId,
  placeholder,
  disabled,
  maxDisplayItems,
  searchPlaceholder,
  minSearchLength,
}: ProcedureMultiSelectProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProcedureName, setNewProcedureName] = useState("");
  const [newProcedureDescription, setNewProcedureDescription] = useState("");
  const [newProcedureCategory, setNewProcedureCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const searchProcedures = useCallback(
    async (query: string): Promise<Procedure[]> => {
      const result = await searchProceduresAction({
        clinicId,
        procedureType,
        searchTerm: query,
        limit: 50,
      });
      return result.data || [];
    },
    [clinicId, procedureType]
  );

  const fetchByIds = useCallback(
    async (ids: number[]): Promise<Procedure[]> => {
      const result = await getProceduresByIdsAction(procedureType, ids);
      return result.data || [];
    },
    [procedureType]
  );

  const getId = useCallback((item: Procedure): number => item.id, []);

  const renderItem = useCallback(
    (item: Procedure): React.ReactNode => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.name}</span>
          {item.isClinicCustom && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              Custom
            </span>
          )}
        </div>
        {item.description && (
          <div className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </div>
        )}
        <div className="text-xs text-muted-foreground">{item.category}</div>
      </div>
    ),
    []
  );

  const handleCreateProcedure = async () => {
    if (!newProcedureName.trim()) {
      toast.error("Please enter a procedure name");
      return;
    }
    if (!newProcedureCategory.trim()) {
      toast.error("Please select or type a category");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createClinicProcedureAction({
        clinicId,
        procedureType,
        name: newProcedureName.trim(),
        category: newProcedureCategory.trim(),
        description: newProcedureDescription.trim() || undefined,
      });

      if (result.data) {
        // Add the newly created procedure to the selection
        onChange([...value, result.data.id]);
        toast.success("Custom procedure created successfully");
        setShowAddDialog(false);
        setNewProcedureName("");
        setNewProcedureDescription("");
        setNewProcedureCategory("");
        setCategorySearch("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create procedure");
    } finally {
      setIsCreating(false);
    }
  };

  // Load master categories for combobox when dialog opens
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await searchProceduresAction({
          clinicId,
          procedureType,
          searchTerm: "",
          limit: 200,
        });

        const cats = (result.data || [])
          .map((proc: Procedure) => proc.category)
          .filter((cat): cat is string => Boolean(cat && cat.trim()));

        setCategories(Array.from(new Set(cats)).sort());
      } catch (error) {
        console.error("Error loading categories", error);
        setCategories([]);
      }
    };

    if (showAddDialog) {
      loadCategories();
    }
  }, [clinicId, procedureType, showAddDialog]);

  return (
    <div className="space-y-2">
      <SmartMultiSelect<Procedure, number>
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Select procedures..."}
        searchPlaceholder={searchPlaceholder || "Search procedures..."}
        disabled={disabled}
        maxDisplayItems={maxDisplayItems}
        minSearchLength={minSearchLength}
        search={searchProcedures}
        fetchByIds={fetchByIds}
        getId={getId}
        renderItem={renderItem}
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowAddDialog(true)}
        disabled={disabled}
        className="w-full"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Custom Procedure
      </Button>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Procedure</DialogTitle>
            <DialogDescription>
              Create a custom procedure specific to your clinic. This will be available for future use.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="procedure-name">Procedure Name *</Label>
              <Input
                id="procedure-name"
                value={newProcedureName}
                onChange={(e) => setNewProcedureName(e.target.value)}
                placeholder="Enter procedure name"
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                    disabled={isCreating}
                  >
                    {newProcedureCategory || "Select or type category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Select from list or type custom category..."
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {categorySearch ? (
                          <div className="p-2 space-y-2">
                            <p className="text-sm text-muted-foreground">No matching categories found</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              onClick={() => {
                                setNewProcedureCategory(categorySearch);
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                            >
                              <PlusCircle className="w-3 h-3 mr-1" />
                              Use "{categorySearch}" as custom category
                            </Button>
                          </div>
                        ) : (
                          "Start typing to search or create custom category"
                        )}
                      </CommandEmpty>
                      {categories.length > 0 && (
                        <CommandGroup heading="Master Categories">
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={() => {
                                setNewProcedureCategory(cat);
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newProcedureCategory === cat ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {cat}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="procedure-description">Description (Optional)</Label>
              <Input
                id="procedure-description"
                value={newProcedureDescription}
                onChange={(e) => setNewProcedureDescription(e.target.value)}
                placeholder="Enter procedure description"
                disabled={isCreating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewProcedureName("");
                setNewProcedureDescription("");
                setNewProcedureCategory("");
                setCategorySearch("");
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateProcedure}
              disabled={isCreating || !newProcedureName.trim() || !newProcedureCategory.trim()}
            >
              {isCreating ? "Creating..." : "Create Procedure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
