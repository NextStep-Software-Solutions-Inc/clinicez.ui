"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GetProvincesResult,
  getProvincesAction,
  createProvinceAction,
  updateProvinceAction,
  toggleProvinceActiveAction,
  deleteProvinceAction,
  getRegionsForSelectAction,
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
import { Search, Plus, Pencil, Trash2, MapPin, ExternalLink, X } from "lucide-react";
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
import { LocationParentCombobox, LocationOption } from "./LocationParentCombobox";

interface ProvincesTabProps {
  initialData: GetProvincesResult;
}

type ProvinceRow = GetProvincesResult["data"][number];

const emptyForm = { code: "", name: "", regionCode: "", isActive: true };

export function ProvincesTab({ initialData }: ProvincesTabProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [filterRegionCode, setFilterRegionCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<ProvinceRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProvinceRow | null>(null);

  // Regions for combobox
  const [regionOptions, setRegionOptions] = useState<LocationOption[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);

  const loadRegions = useCallback(async () => {
    setIsLoadingRegions(true);
    try {
      const regions = await getRegionsForSelectAction();
      setRegionOptions(
        regions.map((r) => ({ code: r.code, label: r.name, description: r.regionName }))
      );
    } catch {
      // silently fail — raw text input still works
    } finally {
      setIsLoadingRegions(false);
    }
  }, []);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const loadData = async (page = 1, searchTerm = search, regionCode = filterRegionCode) => {
    setIsLoading(true);
    try {
      const result = await getProvincesAction({
        search: searchTerm || undefined,
        regionCode: regionCode || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load provinces"));
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (row: ProvinceRow) => {
    setEditingRow(row);
    setForm({ code: row.code, name: row.name, regionCode: row.regionCode, isActive: row.isActive });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingRow) {
        await updateProvinceAction(editingRow.id, form);
        toast.success("Province updated successfully");
      } else {
        await createProvinceAction(form);
        toast.success("Province created successfully");
      }
      setShowDialog(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save province"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (row: ProvinceRow) => {
    try {
      await toggleProvinceActiveAction(row.id, !row.isActive);
      toast.success(`Province ${row.isActive ? "deactivated" : "activated"} successfully`);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update province status"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProvinceAction(deleteTarget.id);
      toast.success("Province deleted successfully");
      setDeleteTarget(null);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete province"));
    }
  };

  const handleRegionSelect = (code: string) => {
    setForm((prev) => ({
      ...prev,
      regionCode: code,
      // Pre-populate PSGC code with region's code as a starting reference when creating
      code: !editingRow && !prev.code ? code : prev.code,
    }));
  };

  const filterRegionLabel = filterRegionCode
    ? (regionOptions.find((r) => r.code === filterRegionCode)?.label ?? filterRegionCode)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search provinces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadData(1, search)}
            className="pl-8"
          />
        </div>

        {/* Region filter combobox */}
        <div className="sm:w-56">
          {regionOptions.length > 0 ? (
            <div className="relative">
              <LocationParentCombobox
                value={filterRegionCode}
                onSelect={(code) => {
                  setFilterRegionCode(code);
                  loadData(1, search, code);
                }}
                options={regionOptions}
                placeholder="Filter by region…"
                searchPlaceholder="Search regions…"
                emptyText="No regions found."
              />
              {filterRegionCode && (
                <button
                  type="button"
                  className="absolute right-8 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFilterRegionCode("");
                    loadData(1, search, "");
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <Input
              placeholder="Filter by region code…"
              value={filterRegionCode}
              onChange={(e) => setFilterRegionCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadData(1, search, filterRegionCode)}
            />
          )}
        </div>

        <Button variant="outline" onClick={() => loadData(1, search, filterRegionCode)} disabled={isLoading}>
          Search
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Province
        </Button>
      </div>

      {filterRegionLabel && (
        <p className="text-sm text-muted-foreground">
          Filtering by region: <span className="font-medium text-foreground">{filterRegionLabel}</span>
        </p>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Municipalities</TableHead>
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
                  No provinces found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.region.name}
                    <span className="ml-1 text-xs opacity-60">({row.region.regionName})</span>
                  </TableCell>
                  <TableCell>{row._count.municipalities}</TableCell>
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} provinces
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
            <DialogTitle>{editingRow ? "Edit Province" : "Add Province"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the province details." : "Enter the details for the new province."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Region</Label>
              <LocationParentCombobox
                value={form.regionCode}
                onSelect={handleRegionSelect}
                options={regionOptions}
                placeholder="Select a region…"
                searchPlaceholder="Search regions…"
                emptyText="No regions found. Seed regions first."
                isLoading={isLoadingRegions}
              />
              {form.regionCode && (
                <p className="text-xs text-muted-foreground font-mono">
                  Region code: {form.regionCode}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="province-code">PSGC Code</Label>
              <Input
                id="province-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 012800000"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                9-digit Philippine Standard Geographic Code.{" "}
                <a
                  href="https://psa.gov.ph/classification/psgc/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  Find codes at PSA PSGC <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="province-name">Name</Label>
              <Input
                id="province-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ilocos Norte"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="province-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="province-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !form.code || !form.name || !form.regionCode}
            >
              {isSaving ? "Saving..." : editingRow ? "Save Changes" : "Create Province"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Province</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the province &quot;{deleteTarget?.name}&quot;? This will also delete all
              associated municipalities and barangays. This action cannot be undone.
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
