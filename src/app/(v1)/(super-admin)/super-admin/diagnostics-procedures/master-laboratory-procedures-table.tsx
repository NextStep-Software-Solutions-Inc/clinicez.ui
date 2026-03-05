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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getAllMasterLaboratoryProceduresAction,
  deleteMasterLaboratoryProcedureAction,
} from "@/actions/super-admin/diagnostics-procedures.action";
import { MasterProcedureForm } from "./master-procedure-form";

export function MasterLaboratoryProceduresTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const pageSize = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "master-laboratory-procedures",
      pageNumber,
      search,
      includeInactive,
    ],
    queryFn: () =>
      getAllMasterLaboratoryProceduresAction({
        pageNumber,
        pageSize,
        search: search || undefined,
        includeInactive,
      }),
  });

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      await deleteMasterLaboratoryProcedureAction({ id: deleteId });
      toast.success("Procedure deleted successfully");
      setDeleteId(null);
      refetch();
    } catch (error) {
      toast.error(
        getActionErrorMessage(error, "Failed to delete procedure")
      );
    }
  }, [deleteId, refetch]);

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNumber(1);
            }}
            className="w-full pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIncludeInactive(!includeInactive)}
          className={includeInactive ? "bg-secondary" : ""}
        >
          {includeInactive ? "Show All" : "Active Only"}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Procedure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Master Laboratory Procedure</DialogTitle>
            </DialogHeader>
            <MasterProcedureForm
              type="laboratory"
              onSuccess={() => {
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data && data.data.length > 0 ? (
              data.data.map((procedure: any) => (
                <TableRow key={procedure.id}>
                  <TableCell className="font-medium">{procedure.name}</TableCell>
                  <TableCell>{procedure.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {procedure.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={procedure.isActive ? "default" : "secondary"}>
                      {procedure.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Laboratory Procedure</DialogTitle>
                        </DialogHeader>
                        <MasterProcedureForm
                          type="laboratory"
                          procedure={procedure}
                          onSuccess={() => {
                            refetch();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(procedure.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No procedures found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPageNumber(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              )
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPageNumber(Math.min(data.totalPages, pageNumber + 1))
            }
            disabled={pageNumber === data.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Procedure</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this procedure? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
