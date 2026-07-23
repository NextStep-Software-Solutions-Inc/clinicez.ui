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
  getSignsAndSymptomsAction,
  upsertSignAndSymptomAction,
  deleteSignAndSymptomAction,
} from "@/actions/super-admin/sign-and-symptom.action";
import { Switch } from "@/components/ui/switch";

type SignAndSymptom = {
  id: string;
  code: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

export default function SignsAndSymptomsTable({
  initialData,
}: {
  initialData: SignAndSymptom[];
}) {
  const queryClient = useQueryClient();
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SignAndSymptom | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  const { data: libraries, isLoading } = useQuery({
    queryKey: ["signsAndSymptoms"],
    queryFn: async () => {
      const res = await getSignsAndSymptomsAction();
      if (res.error) throw new Error(res.error);
      return res.data as SignAndSymptom[];
    },
    initialData,
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      return upsertSignAndSymptomAction(data);
    },
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(selectedItem ? "Item updated successfully" : "Item created successfully");
      queryClient.invalidateQueries({ queryKey: ["signsAndSymptoms"] });
      setIsUpsertOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSignAndSymptomAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["signsAndSymptoms"] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    });
    setSelectedItem(null);
  };

  const openEdit = (item: SignAndSymptom) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      description: item.description,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setIsUpsertOpen(true);
  };

  const openDelete = (item: SignAndSymptom) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Signs and Symptoms</CardTitle>
          <CardDescription>Manage the PhilHealth signs and symptoms codes.</CardDescription>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsUpsertOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : libraries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No signs and symptoms found.
                  </TableCell>
                </TableRow>
              ) : (
                libraries?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isUpsertOpen} onOpenChange={setIsUpsertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit Sign/Symptom" : "Add Sign/Symptom"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem
                ? "Update the details of this item."
                : "Add a new item to the library."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. 01, 02, X"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpsertOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => upsertMutation.mutate({ ...formData, id: selectedItem?.id })}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
