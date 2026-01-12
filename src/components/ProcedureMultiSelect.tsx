"use client";

import React, { useCallback, useState } from "react";
import SmartMultiSelect from "./SmartMultiSelect";
import { 
  searchProceduresAction, 
  getProceduresByIdsAction, 
  createClinicProcedureAction,
  ProcedureType 
} from "@/actions/clinics/clinical-record/procedures.action";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
  const [isCreating, setIsCreating] = useState(false);

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

    setIsCreating(true);
    try {
      const result = await createClinicProcedureAction({
        clinicId,
        procedureType,
        name: newProcedureName.trim(),
        description: newProcedureDescription.trim() || undefined,
      });

      if (result.data) {
        // Add the newly created procedure to the selection
        onChange([...value, result.data.id]);
        toast.success("Custom procedure created successfully");
        setShowAddDialog(false);
        setNewProcedureName("");
        setNewProcedureDescription("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create procedure");
    } finally {
      setIsCreating(false);
    }
  };

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
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateProcedure}
              disabled={isCreating || !newProcedureName.trim()}
            >
              {isCreating ? "Creating..." : "Create Procedure"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
