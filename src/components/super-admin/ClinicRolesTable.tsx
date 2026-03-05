"use client";

import { useState } from "react";
import {
  GetClinicRoles,
  getClinicRolesAction,
} from "@actions/super-admin/clinics.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";

interface ClinicRolesTableProps {
  initialData: GetClinicRoles;
}

type RoleData = GetClinicRoles["data"][number];

export default function ClinicRolesTable({ initialData }: ClinicRolesTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getClinicRolesAction({
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Appointment Tabs</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role._count.ClinicMembers}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role._count.ClinicRoleInitialPermissions}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{role._count.ClinicRoleAppointmentTabs}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
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
    </div>
  );
}
