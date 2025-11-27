"use client"

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { createSurgicalHistoryAction, updateSurgicalHistoryAction, deleteSurgicalHistoryAction } from "@/actions/family-and-personal-history.action";
import type { SurgicalHistory } from "@prisma/client";

interface SurgicalHistorySectionProps {
  userId: string;
  readOnly?: boolean;
  initialData: SurgicalHistory[];
}

export const SurgicalHistorySection = ({
  userId,
  readOnly = false,
  initialData
}: SurgicalHistorySectionProps) => {
  const [isPending, startTransition] = useTransition();
  const [surgeries, setSurgeries] = useState<SurgicalHistory[]>(initialData || []);
  const [newSurgery, setNewSurgery] = useState({
    operationName: "",
    operationDate: "",
    notes: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newSurgery.operationName) {
      toast.error("Operation name is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createSurgicalHistoryAction(userId, {
          operationName: newSurgery.operationName,
          operationDate: newSurgery.operationDate ? new Date(newSurgery.operationDate) : null,
          notes: newSurgery.notes || null,
        });
        
        if (result.status && result.data) {
          toast.success(result.message);
          setSurgeries([...surgeries, result.data]);
          setNewSurgery({ operationName: "", operationDate: "", notes: "" });
          setIsAdding(false);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to add surgical history");
      }
    });
  };

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        const result = await deleteSurgicalHistoryAction(id);
        
        if (result.status) {
          toast.success(result.message);
          setSurgeries(surgeries.filter(s => s.id !== id));
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Failed to delete surgical history");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Surgical History</CardTitle>
        <CardDescription>
          List all surgical operations you've had with their dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {surgeries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operation Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                {!readOnly && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {surgeries.map((surgery) => (
                <TableRow key={surgery.id}>
                  <TableCell>{surgery.operationName}</TableCell>
                  <TableCell>
                    {surgery.operationDate ? new Date(surgery.operationDate).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell>{surgery.notes || "N/A"}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(surgery.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No surgical history recorded.
          </p>
        )}

        {!readOnly && isAdding && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Add New Surgery</h3>
            <div className="space-y-2">
              <Label htmlFor="operationName">Operation Name *</Label>
              <Input
                id="operationName"
                value={newSurgery.operationName}
                onChange={(e) => setNewSurgery({ ...newSurgery, operationName: e.target.value })}
                placeholder="e.g., Appendectomy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationDate">Operation Date</Label>
              <Input
                id="operationDate"
                type="date"
                value={newSurgery.operationDate}
                onChange={(e) => setNewSurgery({ ...newSurgery, operationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newSurgery.notes}
                onChange={(e) => setNewSurgery({ ...newSurgery, notes: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isPending}>
                {isPending ? "Adding..." : "Add Surgery"}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {!readOnly && !isAdding && (
        <CardFooter>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Surgery
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
