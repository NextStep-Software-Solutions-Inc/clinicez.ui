"use client";

import { useState } from "react";
import { GetAllUsers, getAllUsersAction } from "@actions/super-admin/users.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search, Lock } from "lucide-react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { formatDistance } from "date-fns";
import { UserPermissionsDialog } from "./UserPermissionsDialog";

interface UsersTableProps {
  initialData: GetAllUsers;
}

interface SelectedUser {
  id: number;
  email: string;
}

export default function UsersTable({ initialData }: UsersTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllUsersAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load users"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleManagePermissions = (userId: number, email: string) => {
    setSelectedUser({ id: userId, email });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-1">
        <Input
          placeholder="Search users by name, email, or ID..."
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
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Clinic Memberships</TableHead>
              <TableHead>Org Memberships</TableHead>
              <TableHead>Owned Tenants</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.middleName ? user.middleName + " " : ""}{user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user._count.ClinicMembers}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user._count.OrganizationMembers}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user._count.Tenants}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(user.createdAt), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleManagePermissions(user.id, user.email)}
                      title="Manage permissions for this user"
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} users
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

      {selectedUser && (
        <UserPermissionsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
        />
      )}
    </div>
  );
}
