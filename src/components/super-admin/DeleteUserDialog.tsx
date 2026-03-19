"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { deleteUserAction } from "@/actions/super-admin/users.action";

interface DeletableUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: DeletableUser;
  onDeleted: () => void;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onDeleted,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      const result = await deleteUserAction(user.id);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        onDeleted();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete user."));
    } finally {
      setDeleting(false);
    }
  }

  const atIndex = user.email.lastIndexOf("@");
  const localPart = user.email.substring(0, atIndex);
  const domain = user.email.substring(atIndex + 1);
  const deletedEmail = `${localPart}+DELETED@${domain}`;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium">{displayName}</span>? This action will soft-delete the
            user and update their email in both the database and Clerk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-1 py-2 text-sm text-muted-foreground space-y-2">
          <p>The following changes will be made:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>User will be marked as inactive (soft delete)</li>
            <li>
              Email changed from{" "}
              <span className="font-mono text-foreground">{user.email}</span> to{" "}
              <span className="font-mono text-foreground">{deletedEmail}</span>
            </li>
            <li>Email updated in both the database and Clerk</li>
            <li>User will be banned from logging in via Clerk</li>
          </ul>
          <p className="text-destructive font-medium">This action cannot be undone from the UI.</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
