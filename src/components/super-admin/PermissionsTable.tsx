"use client";

import { useState } from "react";
import { GetAllPermissions, getAllPermissionsAction, updatePermissionAction, createPermissionAction } from "@actions/super-admin/permissions.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { Switch } from "@components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@components/ui/alert-dialog";

interface PermissionsTableProps {
  initialData: GetAllPermissions;
}

export default function PermissionsTable({ initialData }: PermissionsTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [typeChangeDialog, setTypeChangeDialog] = useState<{
    open: boolean;
    permissionId: number;
    permissionName: string;
    currentType: string;
    newType: string;
  } | null>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    permissionId: number;
    permissionName: string;
    currentStatus: boolean;
  } | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "USER" as "USER" | "CLINIC" | "ORGANIZATION" | "ADMIN",
  });

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllPermissionsAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
        includeInactive: true, // Include inactive permissions
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load permissions"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleToggleActive = (id: number, name: string, currentStatus: boolean) => {
    setStatusChangeDialog({
      open: true,
      permissionId: id,
      permissionName: name,
      currentStatus,
    });
  };

  const confirmToggleActive = async () => {
    if (!statusChangeDialog) return;

    try {
      await updatePermissionAction({ 
        id: statusChangeDialog.permissionId, 
        isActive: !statusChangeDialog.currentStatus 
      });
      toast.success("Permission status updated successfully");
      loadData(data.pageNumber);
      setStatusChangeDialog(null);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update permission status"));
    }
  };

  const handleTypeChange = (permissionId: number, permissionName: string, currentType: string, newType: string) => {
    setTypeChangeDialog({
      open: true,
      permissionId,
      permissionName,
      currentType,
      newType,
    });
  };

  const confirmTypeChange = async () => {
    if (!typeChangeDialog) return;

    try {
      await updatePermissionAction({ 
        id: typeChangeDialog.permissionId, 
        type: typeChangeDialog.newType as "USER" | "CLINIC" | "ORGANIZATION" | "ADMIN"
      });
      toast.success("Permission type updated successfully");
      loadData(data.pageNumber);
      setTypeChangeDialog(null);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update permission type"));
    }
  };

  const handleCreate = async () => {
    try {
      await createPermissionAction(createForm);
      toast.success("Permission created successfully");
      setIsCreateDialogOpen(false);
      setCreateForm({ name: "", description: "", type: "USER" });
      loadData(1);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to create permission"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Permission</DialogTitle>
              <DialogDescription>
                Add a new permission to the system.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="read:resource:action"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Permission description"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={createForm.type}
                  onValueChange={(value: "USER" | "CLINIC" | "ORGANIZATION" | "ADMIN") => setCreateForm({ ...createForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="CLINIC">Clinic</SelectItem>
                    <SelectItem value="ORGANIZATION">Organization</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No permissions found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-mono text-sm">{permission.name}</TableCell>
                  <TableCell className="text-sm">{permission.description || "-"}</TableCell>
                  <TableCell>
                    <Select
                      value={permission.type}
                      onValueChange={(value) => handleTypeChange(permission.id, permission.name, permission.type, value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="CLINIC">Clinic</SelectItem>
                        <SelectItem value="ORGANIZATION">Organization</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={permission.isActive ? "default" : "secondary"}>
                      {permission.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={permission.isActive}
                      onCheckedChange={() => handleToggleActive(permission.id, permission.name, permission.isActive)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pageNumber - 1) * data.pageSize + 1} to{" "}
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} permissions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber - 1)}
              disabled={data.pageNumber === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(data.pageNumber + 1)}
              disabled={data.pageNumber >= data.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Type Change Confirmation Dialog */}
      <AlertDialog open={typeChangeDialog?.open || false} onOpenChange={(open) => !open && setTypeChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Type Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the type of permission <strong>{`"${typeChangeDialog?.permissionName}"`}</strong> from <strong>{typeChangeDialog?.currentType}</strong> to <strong>{typeChangeDialog?.newType}</strong>?
              <br /><br />
              This action may affect how this permission is used throughout the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTypeChangeDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTypeChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusChangeDialog?.open || false} onOpenChange={(open) => !open && setStatusChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {statusChangeDialog?.currentStatus ? "deactivate" : "activate"} the permission <strong>{`"${statusChangeDialog?.permissionName}"`}</strong>?
              <br /><br />
              {statusChangeDialog?.currentStatus 
                ? "Deactivating this permission may prevent users from accessing certain features."
                : "Activating this permission will allow users to access associated features."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatusChangeDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
