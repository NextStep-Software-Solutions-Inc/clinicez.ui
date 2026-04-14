"use client";

import { useState } from "react";
import {
  GetMunicipalitiesResult,
  getMunicipalitiesAction,
  createMunicipalityAction,
  updateMunicipalityAction,
  toggleMunicipalityActiveAction,
  deleteMunicipalityAction,
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

interface MunicipalitiesTabProps {
  initialData: GetMunicipalitiesResult;
}

type MunicipalityRow = GetMunicipalitiesResult["data"][number];

const emptyForm = {
  code: "",
  name: "",
  provinceCode: "",
  isCity: false,
  isCapital: false,
  isActive: true,
};

export function MunicipalitiesTab({ initialData }: MunicipalitiesTabProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filterProvinceCode, setFilterProvinceCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<MunicipalityRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MunicipalityRow | null>(null);

  const loadData = async (
    page = 1,
    searchTerm = search,
    provinceCode = filterProvinceCode
  ) => {
    setIsLoading(true);
    try {
      const result = await getMunicipalitiesAction({
        search: searchTerm || undefined,
        provinceCode: provinceCode || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load municipalities"));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (row: MunicipalityRow) => {
    setEditingRow(row);
    setForm({
      code: row.code,
      name: row.name,
      provinceCode: row.provinceCode,
      isCity: row.isCity,
      isCapital: row.isCapital,
      isActive: row.isActive,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingRow) {
        await updateMunicipalityAction(editingRow.id, form);
        toast.success("Municipality updated successfully");
      } else {
        await createMunicipalityAction(form);
        toast.success("Municipality created successfully");
      }
      setShowDialog(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save municipality"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row: MunicipalityRow) => {
    try {
      await toggleMunicipalityActiveAction(row.id, !row.isActive);
      toast.success(`Municipality ${row.isActive ? "deactivated" : "activated"} successfully`);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update municipality status"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMunicipalityAction(deleteTarget.id);
      toast.success("Municipality deleted successfully");
      setDeleteTarget(null);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete municipality"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search municipalities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1, search)}
            className="pl-8"
          />
        </div>
        <Input
          placeholder="Filter by province code..."
          value={filterProvinceCode}
          onChange={(e) => setFilterProvinceCode(e.target.value)}
          className="sm:w-52"
          onKeyDown={(e) => e.key === "Enter" && loadData(1, search, filterProvinceCode)}
        />
        <Button
          variant="outline"
          onClick={() => loadData(1, search, filterProvinceCode)}
          disabled={isLoading}
        >
          Search
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Municipality
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Province</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Barangays</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <MapPin className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No municipalities found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">
                    {row.name}
                    {row.isCapital && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Capital
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.province.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.isCity ? "City" : "Municipality"}</Badge>
                  </TableCell>
                  <TableCell>{row._count.barangays}</TableCell>
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} municipalities
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
            <DialogTitle>{editingRow ? "Edit Municipality" : "Add Municipality"}</DialogTitle>
            <DialogDescription>
              {editingRow
                ? "Update the municipality details."
                : "Enter the details for the new municipality."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="muni-code">PSGC Code</Label>
              <Input
                id="muni-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 012801000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muni-name">Name</Label>
              <Input
                id="muni-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Adams"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muni-province-code">Province Code</Label>
              <Input
                id="muni-province-code"
                value={form.provinceCode}
                onChange={(e) => setForm({ ...form, provinceCode: e.target.value })}
                placeholder="e.g. 012800000"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="muni-is-city"
                  checked={form.isCity}
                  onCheckedChange={(checked) => setForm({ ...form, isCity: checked })}
                />
                <Label htmlFor="muni-is-city">Is City</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="muni-is-capital"
                  checked={form.isCapital}
                  onCheckedChange={(checked) => setForm({ ...form, isCapital: checked })}
                />
                <Label htmlFor="muni-is-capital">Is Capital</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="muni-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
                <Label htmlFor="muni-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.code || !form.name || !form.provinceCode}
            >
              {isSaving ? "Saving..." : editingRow ? "Save Changes" : "Create Municipality"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Municipality</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This will also delete all associated
              barangays. This action cannot be undone.
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
