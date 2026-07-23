"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getAllDiagnosticProceduresAction,
  deleteDiagnosticProcedureAction,
} from "@/actions/super-admin/diagnostic-procedures-crud.action";
import { DiagnosticProcedureForm } from "./diagnostic-procedure-form";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DiagnosticProceduresTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProcedure, setEditProcedure] = useState<any | null>(null);
  const [deleteProcedure, setDeleteProcedure] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPageNumber(1);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["diagnostic-procedures", debouncedSearch, pageNumber, pageSize],
    queryFn: async () => {
      const result = await getAllDiagnosticProceduresAction({
        search: debouncedSearch,
        pageNumber,
        pageSize,
        includeInactive: true,
      });
      return result;
    },
  });

  const handleDelete = async () => {
    if (!deleteProcedure) return;

    setIsDeleting(true);
    try {
      await deleteDiagnosticProcedureAction(deleteProcedure.id);
      toast.success("Procedure deleted successfully");
      setDeleteProcedure(null);
      refetch();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete procedure"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    setCreateOpen(false);
    setEditProcedure(null);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search procedures..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Procedure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Diagnostic Procedure</DialogTitle>
            </DialogHeader>
            <DiagnosticProcedureForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>PhilHealth ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading procedures...
                </TableCell>
              </TableRow>
            ) : !data?.data?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No procedures found.
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((proc) => (
                <TableRow key={proc.id}>
                  <TableCell className="font-medium">
                    {proc.name}
                    {proc.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {proc.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{proc.category}</TableCell>
                  <TableCell>{proc.philhealthDiagnosticId || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={proc.isActive ? "default" : "secondary"}>
                      {proc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditProcedure(proc)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteProcedure(proc)}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPageNumber(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {pageNumber} of {data?.totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => p + 1)}
            disabled={pageNumber >= (data?.totalPages || 1) || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={!!editProcedure}
        onOpenChange={(open) => !open && setEditProcedure(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Diagnostic Procedure</DialogTitle>
          </DialogHeader>
          {editProcedure && (
            <DiagnosticProcedureForm
              procedure={editProcedure}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteProcedure}
        onOpenChange={(open) => !open && setDeleteProcedure(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the procedure "{deleteProcedure?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
