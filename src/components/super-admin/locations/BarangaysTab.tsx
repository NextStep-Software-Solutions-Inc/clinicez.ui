"use client";

import { useState } from "react";
import {
  GetBarangaysResult,
  getBarangaysAction,
  createBarangayAction,
  updateBarangayAction,
  toggleBarangayActiveAction,
  deleteBarangayAction,
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

interface BarangaysTabProps {
  initialData: GetBarangaysResult;
}

type BarangayRow = GetBarangaysResult["data"][number];

const emptyForm = { code: "", name: "", municipalityCode: "", isActive: true };

export function BarangaysTab({ initialData }: BarangaysTabProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filterMunicipalityCode, setFilterMunicipalityCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<BarangayRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BarangayRow | null>(null);

  const loadData = async (
    page = 1,
    searchTerm = search,
    municipalityCode = filterMunicipalityCode
  ) => {
    setIsLoading(true);
    try {
      const result = await getBarangaysAction({
        search: searchTerm || undefined,
        municipalityCode: municipalityCode || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load barangays"));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (row: BarangayRow) => {
    setEditingRow(row);
    setForm({
      code: row.code,
      name: row.name,
      municipalityCode: row.municipalityCode,
      isActive: row.isActive,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingRow) {
        await updateBarangayAction(editingRow.id, form);
        toast.success("Barangay updated successfully");
      } else {
        await createBarangayAction(form);
        toast.success("Barangay created successfully");
      }
      setShowDialog(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save barangay"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row: BarangayRow) => {
    try {
      await toggleBarangayActiveAction(row.id, !row.isActive);
      toast.success(`Barangay ${row.isActive ? "deactivated" : "activated"} successfully`);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update barangay status"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBarangayAction(deleteTarget.id);
      toast.success("Barangay deleted successfully");
      setDeleteTarget(null);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete barangay"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search barangays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1, search)}
            className="pl-8"
          />
        </div>
        <Input
          placeholder="Filter by municipality code..."
          value={filterMunicipalityCode}
          onChange={(e) => setFilterMunicipalityCode(e.target.value)}
          className="sm:w-56"
          onKeyDown={(e) => e.key === "Enter" && loadData(1, search, filterMunicipalityCode)}
        />
        <Button
          variant="outline"
          onClick={() => loadData(1, search, filterMunicipalityCode)}
          disabled={isLoading}
        >
          Search
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Barangay
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Municipality / City</TableHead>
              <TableHead>Province</TableHead>
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
                  No barangays found. Use the municipality code filter to narrow results.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.municipality.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.municipality.provinceCode}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActive(row)}>
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} barangays
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
            <DialogTitle>{editingRow ? "Edit Barangay" : "Add Barangay"}</DialogTitle>
            <DialogDescription>
              {editingRow
                ? "Update the barangay details."
                : "Enter the details for the new barangay."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="brgy-code">PSGC Code</Label>
              <Input
                id="brgy-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 012801001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brgy-name">Name</Label>
              <Input
                id="brgy-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Adams (Pob.)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brgy-municipality-code">Municipality Code</Label>
              <Input
                id="brgy-municipality-code"
                value={form.municipalityCode}
                onChange={(e) => setForm({ ...form, municipalityCode: e.target.value })}
                placeholder="e.g. 012801000"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="brgy-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="brgy-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.code || !form.name || !form.municipalityCode}
            >
              {isSaving ? "Saving..." : editingRow ? "Save Changes" : "Create Barangay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Barangay</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the barangay &quot;{deleteTarget?.name}&quot;? This action cannot be
              undone.
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
