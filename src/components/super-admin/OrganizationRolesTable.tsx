"use client";

import { useState } from "react";
import {
  GetOrganizationRoles,
  getOrganizationRolesAction,
  createOrganizationRoleAction,
  updateOrganizationRoleAction,
  deleteOrganizationRoleAction,
} from "@actions/super-admin/organizations.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
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
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";

interface OrganizationRolesTableProps {
  initialData: GetOrganizationRoles;
  orgId: number;
}

type RoleData = GetOrganizationRoles["data"][number];

export default function OrganizationRolesTable({ initialData, orgId }: OrganizationRolesTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getOrganizationRolesAction({
        orgId,
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load roles"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleOpenDialog = (role?: RoleData) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || "");
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleDescription("");
    }
    setShowDialog(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateOrganizationRoleAction({
          id: editingRole.id,
          name: roleName,
          description: roleDescription || undefined,
        });
        toast.success("Role updated successfully");
      } else {
        await createOrganizationRoleAction({
          orgId,
          name: roleName,
          description: roleDescription || undefined,
        });
        toast.success("Role created successfully");
      }
      setShowDialog(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to save role"));
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      await deleteOrganizationRoleAction(roleId);
      toast.success("Role deleted successfully");
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete role"));
    }
  };

  const handleToggleStatus = async (roleId: number, currentStatus: boolean) => {
    try {
      await updateOrganizationRoleAction({
        id: roleId,
        isActive: !currentStatus,
      });
      toast.success(`Role ${!currentStatus ? "activated" : "deactivated"} successfully`);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to update role status"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role._count.OrganizationMembers}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role._count.OrgRoleInitialPermissions}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={role.isActive ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(role.id, role.isActive)}
                    >
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id, role.name)}
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

      {data.totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pageNumber - 1) * data.pageSize + 1} to{" "}
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} roles
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add New Role"}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? "Update the role name and description."
                : "Create a new role for this organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name *</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Administrator, Manager, Staff"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe the role and its responsibilities..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
