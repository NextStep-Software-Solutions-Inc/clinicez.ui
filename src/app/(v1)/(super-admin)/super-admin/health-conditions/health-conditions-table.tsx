"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getHealthConditionsAction,
  createHealthConditionAction,
  updateHealthConditionAction,
  deleteHealthConditionAction,
} from "@/actions/super-admin/health-conditions.action";

type HealthCondition = {
  id: number;
  name: string;
  code: string | null;
  libraryStatus: number;
  isActive: boolean;
};

export function HealthConditionsTable() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<HealthCondition | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    libraryStatus: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["super-admin-health-conditions"],
    queryFn: async () => {
      const res = await getHealthConditionsAction();
      if (res.error) throw new Error(res.error);
      return res.data as HealthCondition[];
    },
  });

  const createMutation = useMutation({
    mutationFn: createHealthConditionAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Health condition created successfully");
        queryClient.invalidateQueries({ queryKey: ["super-admin-health-conditions"] });
        closeForm();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; input: any }) => updateHealthConditionAction(data.id, data.input),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Health condition updated successfully");
        queryClient.invalidateQueries({ queryKey: ["super-admin-health-conditions"] });
        closeForm();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHealthConditionAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Health condition deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["super-admin-health-conditions"] });
        setIsDeleteOpen(false);
        setSelectedCondition(null);
      }
    },
  });

  const filteredData = data?.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  }) ?? [];

  const handleEdit = (condition: HealthCondition) => {
    setSelectedCondition(condition);
    setFormData({
      code: condition.code || "",
      name: condition.name,
      libraryStatus: condition.libraryStatus,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedCondition(null);
    setFormData({ code: "", name: "", libraryStatus: 1 });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (selectedCondition) {
      updateMutation.mutate({
        id: selectedCondition.id,
        input: {
          code: formData.code.trim() || undefined,
          name: formData.name.trim(),
          libraryStatus: formData.libraryStatus,
        },
      });
    } else {
      createMutation.mutate({
        code: formData.code.trim() || undefined,
        name: formData.name.trim(),
        libraryStatus: formData.libraryStatus,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="max-w-sm w-full">
          <Input
            placeholder="Search by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Health Conditions</CardTitle>
          <CardDescription>
            Manage PhilHealth MDISEASE codes and descriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Library Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No health conditions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.code || "-"}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.libraryStatus}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(c)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {c.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              setSelectedCondition(c);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCondition ? "Edit Condition" : "Add Condition"}</DialogTitle>
            <DialogDescription>
              Provide the PhilHealth code and description for this condition.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>PhilHealth Code</Label>
              <Input
                placeholder="e.g. 001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. Allergy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Library Status</Label>
              <Input
                type="number"
                value={formData.libraryStatus}
                onChange={(e) => setFormData({ ...formData, libraryStatus: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {selectedCondition ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark "{selectedCondition?.name}" as inactive. It will no longer be available for new selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (selectedCondition) {
                  deleteMutation.mutate(selectedCondition.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
