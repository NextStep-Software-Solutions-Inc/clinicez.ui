"use client";

import { useState } from "react";
import { GetAllRoles, getAllRolesAction, updateClinicRoleAction, createClinicRoleAction } from "@actions/super-admin/roles.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@components/ui/dialog";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { Switch } from "@components/ui/switch";

interface RolesTableProps {
  initialData: GetAllRoles;
  type: "CLINIC" | "ORGANIZATION";
}

export default function RolesTable({ initialData, type }: RolesTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "" });

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllRolesAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
        type,
      });
      setData(result);
    } catch (error) {
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    if (type === "CLINIC") {
      try {
        await updateClinicRoleAction({ id, isActive: !currentStatus });
        toast.success("Role updated successfully");
        loadData(data.pageNumber);
      } catch (error) {
        toast.error("Failed to update role");
      }
    } else {
      toast.info("Organization role management not yet implemented");
    }
  };

  const handleCreate = async () => {
    if (type === "CLINIC") {
      try {
        await createClinicRoleAction(createForm);
        toast.success("Role created successfully");
        setIsCreateDialogOpen(false);
        setCreateForm({ name: "" });
        loadData(1);
      } catch (error) {
        toast.error("Failed to create role");
      }
    } else {
      toast.info("Organization role creation not yet implemented");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
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
        {type === "CLINIC" && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Clinic Role</DialogTitle>
                <DialogDescription>Add a new clinic role to the system.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Role name"
                  />
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
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {type === "ORGANIZATION" && <TableHead>Organization</TableHead>}
              <TableHead>Members</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={type === "ORGANIZATION" ? 6 : 5} className="text-center text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  {type === "ORGANIZATION" && "Organization" in role && (
                    <TableCell className="text-sm">{role.Organization.name}</TableCell>
                  )}
                  <TableCell>
                    {"_count" in role && (
                      <Badge variant="outline">
                        {type === "CLINIC" && "_count" in role && "ClinicMembers" in role._count
                          ? role._count.ClinicMembers
                          : "_count" in role && "OrganizationMembers" in role._count
                            ? role._count.OrganizationMembers
                            : 0}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {"_count" in role && (
                      <Badge variant="outline">
                        {type === "CLINIC" && "_count" in role && "ClinicRoleInitialPermissions" in role._count
                          ? role._count.ClinicRoleInitialPermissions
                          : "_count" in role && "OrgRoleInitialPermissions" in role._count
                            ? role._count.OrgRoleInitialPermissions
                            : 0}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {type === "CLINIC" && (
                      <Switch
                        checked={role.isActive}
                        onCheckedChange={() => handleToggleActive(role.id, role.isActive)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
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
    </div>
  );
}
