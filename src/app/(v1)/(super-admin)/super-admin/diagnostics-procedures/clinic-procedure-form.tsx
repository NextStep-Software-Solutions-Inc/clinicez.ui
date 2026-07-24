"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { useQuery } from "@tanstack/react-query";
import { Plus, Link as LinkIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createClinicImagingProcedureAction,
  createClinicLaboratoryProcedureAction,
  createClinicHeartStationProcedureAction,
  updateClinicProcedureAction,
  getAllMasterImagingProceduresAction,
  getAllMasterLaboratoryProceduresAction,
  getAllMasterHeartStationProceduresAction,
} from "@/actions/super-admin/diagnostics-procedures.action";

interface ClinicProcedureFormProps {
  clinicId: number;
  type: "imaging" | "laboratory" | "heart_station";
  procedure?: any;
  onSuccess?: () => void;
}

export function ClinicProcedureForm({
  clinicId,
  type,
  procedure,
  onSuccess,
}: ClinicProcedureFormProps) {
  const [mode, setMode] = useState<"custom" | "link">(procedure?.masterProcedureId ? "link" : "custom");
  const [formData, setFormData] = useState({
    name: procedure?.name || "",
    category: procedure?.category || "",
    description: procedure?.description || "",
    masterProcedureId: procedure?.masterProcedureId || "",
    isActive: procedure?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Get appropriate master procedures based on type
  let queryFn: any;
  if (type === "imaging") {
    queryFn = () =>
      getAllMasterImagingProceduresAction({
        pageNumber: 1,
        pageSize: 1000,
        includeInactive: false,
      });
  } else if (type === "laboratory") {
    queryFn = () =>
      getAllMasterLaboratoryProceduresAction({
        pageNumber: 1,
        pageSize: 1000,
        includeInactive: false,
      });
  } else {
    queryFn = () =>
      getAllMasterHeartStationProceduresAction({
        pageNumber: 1,
        pageSize: 1000,
        includeInactive: false,
      });
  }

  const { data: masterProcedures } = useQuery<any>({
    queryKey: [`master-procedures-${type}`],
    queryFn,
  });

  // Extract unique categories from master procedures
  const masterCategories = useMemo(() => {
    if (!masterProcedures?.data) return [];
    const categories = masterProcedures.data
      .map((proc: any) => proc.category)
      .filter((cat: string) => cat && cat.trim() !== "");
    return Array.from(new Set(categories)).sort() as string[];
  }, [masterProcedures]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return masterCategories;
    return masterCategories.filter((cat) =>
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [masterCategories, categorySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on mode
    if (mode === "custom") {
      if (!formData.name.trim()) {
        toast.error("Procedure name is required");
        return;
      }
      if (!formData.category) {
        toast.error("Category is required for custom procedures");
        return;
      }
    } else {
      if (!formData.masterProcedureId) {
        toast.error("Please select a master procedure");
        return;
      }
      if (!formData.name.trim()) {
        // Auto-generate name from master procedure if not provided
        const masterProc = masterProcedures?.data?.find(
          (p: any) => p.id.toString() === formData.masterProcedureId
        );
        if (!masterProc) {
          toast.error("Master procedure not found");
          return;
        }
        setFormData({ ...formData, name: masterProc.name, category: masterProc.category });
      }
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        clinicId,
        name: formData.name || (masterProcedures?.data?.find((p: any) => p.id.toString() === formData.masterProcedureId)?.name || ""),
        category: formData.category || (masterProcedures?.data?.find((p: any) => p.id.toString() === formData.masterProcedureId)?.category || undefined),
        description: formData.description || undefined,
        masterProcedureId: formData.masterProcedureId
          ? parseInt(formData.masterProcedureId)
          : undefined,
      };

      if (procedure?.id) {
        // Update
        await updateClinicProcedureAction({
          type,
          id: procedure.id,
          ...submitData,
          isActive: formData.isActive,
        });
        toast.success("Procedure updated successfully");
      } else {
        // Create
        if (type === "imaging") {
          await createClinicImagingProcedureAction(submitData);
        } else if (type === "laboratory") {
          await createClinicLaboratoryProcedureAction(submitData);
        } else {
          await createClinicHeartStationProcedureAction(submitData);
        }
        toast.success("Procedure created successfully");
      }

      onSuccess?.();
      setFormData({
        name: "",
        category: "",
        description: "",
        masterProcedureId: "",
        isActive: true,
      });
    } catch (error) {
      toast.error(
        getActionErrorMessage(error, "Failed to save procedure")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Choose Mode */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Step 1: Choose How to Add Procedure</Label>
        <RadioGroup value={mode} onValueChange={(value: any) => setMode(value)}>
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="custom" id="mode-custom" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="mode-custom" className="cursor-pointer font-medium">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Custom Procedure
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new procedure specific to this clinic (not linked to master)
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <RadioGroupItem value="link" id="mode-link" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="mode-link" className="cursor-pointer font-medium">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Link to Master Procedure
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select an existing master procedure and customize it for this clinic
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Step 2: Based on Mode */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Step 2: Procedure Details</Label>

        {mode === "link" ? (
          <>
            {/* Link Mode */}
            <div>
              <Label htmlFor="master">Select Master Procedure *</Label>
              <Select
                value={formData.masterProcedureId || ""}
                onValueChange={(value) => {
                  const selectedProc = masterProcedures?.data?.find((p: any) => p.id.toString() === value);
                  setFormData({ 
                    ...formData, 
                    masterProcedureId: value,
                    category: selectedProc?.category || "",
                    name: selectedProc?.name || formData.name,
                  });
                }}
              >
                <SelectTrigger id="master">
                  <SelectValue placeholder="Choose a master procedure..." />
                </SelectTrigger>
                <SelectContent>
                  {!masterProcedures?.data || masterProcedures.data.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No master procedures available. Create one first.
                    </div>
                  ) : (
                    (() => {
                      const grouped = masterProcedures.data.reduce((acc: Record<string, any[]>, proc: any) => {
                        if (!acc[proc.category]) {
                          acc[proc.category] = [];
                        }
                        acc[proc.category].push(proc);
                        return acc;
                      }, {});
                      
                      return Object.entries(grouped)
                        .sort(([catA], [catB]) => catA.localeCompare(catB))
                        .map(([category, procedures]) => (
                          <SelectGroup key={category}>
                            <SelectLabel className="font-semibold text-xs uppercase tracking-wider py-2">
                              {category}
                            </SelectLabel>
                            {(procedures as any[])
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((proc: any) => (
                                <SelectItem key={proc.id} value={proc.id.toString()}>
                                  {proc.name}
                                </SelectItem>
                              ))}
                          </SelectGroup>
                        ));
                    })()
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Your clinic name will be added as a suffix to the master procedure name
              </p>
            </div>

            {formData.masterProcedureId && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  ✓ Linked to master procedure. You can add clinic-specific details below.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            {/* Custom Mode */}
            <div>
              <Label htmlFor="name">Procedure Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Brain CT Scan"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Create a custom name for this clinic-specific procedure
              </p>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                  >
                    {formData.category || "Select or type category..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Select from list or type custom category..."
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {categorySearch ? (
                          <div className="p-2">
                            <p className="text-sm text-muted-foreground mb-2">
                              No matching categories found
                            </p>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              onClick={() => {
                                setFormData({ ...formData, category: categorySearch });
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Use &quot;{categorySearch}&quot; as custom category
                            </Button>
                          </div>
                        ) : (
                          "Start typing to search or create custom category"
                        )}
                      </CommandEmpty>
                      {filteredCategories.length > 0 && (
                        <CommandGroup heading="Master Categories">
                          {filteredCategories.map((cat) => (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={() => {
                                setFormData({ ...formData, category: cat });
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.category === cat ? "opacity-100" : "opacity-0"
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
              <p className="text-xs text-muted-foreground mt-1">
                Select from master categories or type a custom category
              </p>
            </div>
          </>
        )}

        {/* Description (shown in both modes) */}
        <div>
          <Label htmlFor="description">Clinic-Specific Details (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={
              mode === "link"
                ? "Add any clinic-specific notes or instructions..."
                : "Add details about this procedure..."
            }
            rows={3}
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked as boolean })
            }
          />
          <Label htmlFor="isActive" className="font-medium cursor-pointer">
            Active (Enable this procedure for clinicians)
          </Label>
        </div>
      </div>

      {/* Validation Alert */}
      {mode === "link" && !formData.masterProcedureId && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-sm text-amber-900">
            ⚠ Select a master procedure to continue
          </AlertDescription>
        </Alert>
      )}

      {mode === "custom" && !formData.name && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-sm text-amber-900">
            ⚠ Enter a procedure name to continue
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || (mode === "link" && !formData.masterProcedureId) || (mode === "custom" && !formData.name.trim())}
        >
          {isSubmitting
            ? "Saving..."
            : procedure
              ? "Update Procedure"
              : "Create Procedure"}
        </Button>
      </div>
    </form>
  );
}
