"use client";

import { useState } from "react";
import {
  GetRegionsResult,
  getRegionsAction,
  createRegionAction,
  updateRegionAction,
  toggleRegionActiveAction,
  deleteRegionAction,
} from "@actions/super-admin/locations.action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import { Switch } from "@components/ui/switch";
import { Search, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";

interface RegionsTabProps {
  initialData: GetRegionsResult;
}

type RegionRow = GetRegionsResult["data"][number];

const emptyForm = { code: "", name: "", regionName: "", isActive: true };

export function RegionsTab({ initialData }: RegionsTabProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<RegionRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RegionRow | null>(null);

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getRegionsAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load regions"));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (row: RegionRow) => {
    setEditingRow(row);
    setForm({ code: row.code, name: row.name, regionName: row.regionName, isActive: row.isActive });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingRow) {
        await updateRegionAction(editingRow.id, form);
        toast.success("Region updated successfully");
      } else {
        await createRegionAction(form);
        toast.success("Region created successfully");
      }
      setShowDialog(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save region"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row: RegionRow) => {
    try {
      await toggleRegionActiveAction(row.id, !row.isActive);
      toast.success(`Region ${row.isActive ? "deactivated" : "activated"} successfully`);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update region status"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRegionAction(deleteTarget.id);
      toast.success("Region deleted successfully");
      setDeleteTarget(null);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete region"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search regions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1, search)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => loadData(1, search)} disabled={isLoading}>
          Search
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Region
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Region Name</TableHead>
              <TableHead>Provinces</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No regions found. Add one to get started, or seed from the Philippine locations data.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.regionName}</TableCell>
                  <TableCell>{row._count.provinces}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(row)}
                      >
                        {row.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(data.pageNumber - 1) * data.pageSize + 1}–
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} regions
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.pageNumber <= 1 || isLoading}
              onClick={() => loadData(data.pageNumber - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pageNumber >= data.totalPages || isLoading}
              onClick={() => loadData(data.pageNumber + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Region" : "Add Region"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the region details." : "Enter the details for the new region."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="region-code">PSGC Code</Label>
              <Input
                id="region-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 010000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-name">Name</Label>
              <Input
                id="region-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ilocos Region"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region-region-name">Region Name</Label>
              <Input
                id="region-region-name"
                value={form.regionName}
                onChange={(e) => setForm({ ...form, regionName: e.target.value })}
                placeholder="e.g. Region I"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="region-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="region-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.code || !form.name || !form.regionName}
            >
              {isSaving ? "Saving..." : editingRow ? "Save Changes" : "Create Region"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the region &quot;{deleteTarget?.name}&quot;? This will also delete all
              associated provinces, municipalities, and barangays. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
