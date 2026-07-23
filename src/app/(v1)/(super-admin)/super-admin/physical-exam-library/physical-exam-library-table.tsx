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
  getPhysicalExamLibrariesAction,
  createPhysicalExamLibraryAction,
  updatePhysicalExamLibraryAction,
  deletePhysicalExamLibraryAction,
} from "@/actions/super-admin/physical-exam-library.action";
import { Switch } from "@/components/ui/switch";

type PhysicalExamLibrary = {
  id: string;
  category: string;
  code: string;
  description: string;
  libraryStatus: number;
  isActive: boolean;
};

export default function PhysicalExamLibraryTable({
  initialData,
}: {
  initialData: PhysicalExamLibrary[];
}) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PhysicalExamLibrary | null>(null);

  const [formData, setFormData] = useState({
    category: "",
    code: "",
    description: "",
    libraryStatus: 1,
    isActive: true,
  });

  const { data: libraries, isLoading } = useQuery({
    queryKey: ["physicalExamLibraries"],
    queryFn: async () => {
      const res = await getPhysicalExamLibrariesAction();
      if (res.error) throw new Error(res.error);
      return res.data as PhysicalExamLibrary[];
    },
    initialData,
  });

  const createMutation = useMutation({
    mutationFn: createPhysicalExamLibraryAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Library item created successfully");
      queryClient.invalidateQueries({ queryKey: ["physicalExamLibraries"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create item");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      updatePhysicalExamLibraryAction(data.id, data.payload),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Library item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["physicalExamLibraries"] });
      setIsUpdateOpen(false);
      setSelectedItem(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update item");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhysicalExamLibraryAction,
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Library item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["physicalExamLibraries"] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  const resetForm = () => {
    setFormData({
      category: "",
      code: "",
      description: "",
      libraryStatus: 1,
      isActive: true,
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.code || !formData.description) {
      toast.error("Category, code, and description are required.");
      return;
    }
    createMutation.mutate({
      category: formData.category,
      code: formData.code,
      description: formData.description,
      libraryStatus: formData.libraryStatus,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formData.category || !formData.code || !formData.description) {
      toast.error("Category, code, and description are required.");
      return;
    }
    updateMutation.mutate({
      id: selectedItem.id,
      payload: {
        category: formData.category,
        code: formData.code,
        description: formData.description,
        libraryStatus: formData.libraryStatus,
        isActive: formData.isActive,
      },
    });
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    deleteMutation.mutate(selectedItem.id);
  };

  const openUpdate = (item: PhysicalExamLibrary) => {
    setSelectedItem(item);
    setFormData({
      category: item.category,
      code: item.code,
      description: item.description,
      libraryStatus: item.libraryStatus,
      isActive: item.isActive,
    });
    setIsUpdateOpen(true);
  };

  const openDelete = (item: PhysicalExamLibrary) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Physical Exam Library Configuration</CardTitle>
          <CardDescription>Manage dropdown values for Physical Examination systems.</CardDescription>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Library Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : libraries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No physical exam library items found.
                  </TableCell>
                </TableRow>
              ) : (
                libraries?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      {item.libraryStatus === 1 ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Deactivated
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isActive ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openUpdate(item)}
                        >
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Library Item</DialogTitle>
            <DialogDescription>
              Create a new physical examination library dictionary code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category (e.g. CHEST, HEENT)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                  placeholder="HEENT"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code (e.g. 1, 2, 99)</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="1"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Essentially normal"
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="libraryStatus">Library Status (1=Active)</Label>
                <Switch
                  id="libraryStatus"
                  checked={formData.libraryStatus === 1}
                  onCheckedChange={(c) => setFormData({ ...formData, libraryStatus: c ? 1 : 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Library Item</DialogTitle>
            <DialogDescription>
              Update the physical examination library dictionary code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Code</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="edit-libraryStatus">Library Status (1=Active)</Label>
                <Switch
                  id="edit-libraryStatus"
                  checked={formData.libraryStatus === 1}
                  onCheckedChange={(c) => setFormData({ ...formData, libraryStatus: c ? 1 : 0 })}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="edit-isActive">Is Active</Label>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the library
              item from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
