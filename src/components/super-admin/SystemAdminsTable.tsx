"use client";

import { useState } from "react";
import { GetAllSystemAdmins, getAllSystemAdminsAction, revokeSystemAdminAction } from "@actions/super-admin/system-admins.action";
import { getAllUsersAction } from "@actions/super-admin/users.action";
import { grantSystemAdminAction } from "@actions/super-admin/system-admins.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
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

// Error message constant to match server-side
const ERROR_LAST_ADMIN = "Cannot remove the last system admin. At least one system admin must remain.";
const TOOLTIP_LAST_ADMIN = "Cannot remove the last system admin";

interface SystemAdminsTableProps {
  initialData: GetAllSystemAdmins;
}

export default function SystemAdminsTable({ initialData }: SystemAdminsTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [userToRevoke, setUserToRevoke] = useState<{ id: number; name: string } | null>(null);

  const loadData = async (page = 1, searchTerm = search) => {
    setIsLoading(true);
    try {
      const result = await getAllSystemAdminsAction({
        search: searchTerm || undefined,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error("Failed to load system admins");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleRevokeAdmin = async (userId: number, userName: string) => {
    // Check if this is the last system admin
    if (data.total <= 1) {
      toast.error(ERROR_LAST_ADMIN);
      return;
    }

    // Open the confirmation dialog
    setUserToRevoke({ id: userId, name: userName });
    setShowRevokeDialog(true);
  };

  const confirmRevokeAdmin = async () => {
    if (!userToRevoke) return;

    try {
      await revokeSystemAdminAction({ userId: userToRevoke.id });
      toast.success("System admin privileges revoked successfully");
      loadData(data.pageNumber);
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke system admin privileges");
    } finally {
      setShowRevokeDialog(false);
      setUserToRevoke(null);
    }
  };

  const searchUsers = async () => {
    if (!userSearch) return;
    
    setIsLoadingUsers(true);
    try {
      const result = await getAllUsersAction({
        search: userSearch,
        pageSize: 10,
        pageNumber: 1,
      });
      // Filter out users who are already system admins
      const filtered = result.data.filter(
        (user) => !data.data.some((admin) => admin.id === user.id)
      );
      setAvailableUsers(filtered);
    } catch (error) {
      toast.error("Failed to search users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleGrantAdmin = async () => {
    if (!selectedUserId) return;

    try {
      await grantSystemAdminAction({ userId: selectedUserId });
      toast.success("System admin privileges granted successfully");
      setShowAddDialog(false);
      setSelectedUserId(null);
      setUserSearch("");
      setAvailableUsers([]);
      loadData(data.pageNumber);
    } catch (error: any) {
      toast.error(error.message || "Failed to grant system admin privileges");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search system admins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add System Admin
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No system admins found
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
                    {user.isSuperAdmin ? (
                      <Badge variant="default">Super Admin</Badge>
                    ) : (
                      <Badge variant="secondary">System Admin</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(user.createdAt), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.total <= 1 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-block">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={true}
                                className="pointer-events-none"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Revoke
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{TOOLTIP_LAST_ADMIN}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeAdmin(user.id, `${user.firstName} ${user.lastName}`)}
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Revoke
                      </Button>
                    )}
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} system admins
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System Admin</DialogTitle>
            <DialogDescription>
              Search for a user and grant them system admin privileges.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search users by name, email, or ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              />
              <Button onClick={searchUsers} disabled={isLoadingUsers}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {availableUsers.length > 0 && (
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 ${
                      selectedUserId === user.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="font-medium">
                      {user.firstName} {user.middleName ? user.middleName + " " : ""}{user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAdmin} disabled={!selectedUserId}>
              Grant System Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={showRevokeDialog} 
        onOpenChange={(open) => {
          setShowRevokeDialog(open);
          if (!open) setUserToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke System Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke system admin privileges from <strong>{userToRevoke?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeAdmin}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
