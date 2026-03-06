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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getAllMasterHeartStationProceduresAction,
  deleteMasterHeartStationProcedureAction,
} from "@/actions/super-admin/diagnostics-procedures.action";
import { MasterProcedureForm } from "./master-procedure-form";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 1000, 5000, 10000];

export function MasterHeartStationProceduresTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "master-heart-station-procedures",
      pageNumber,
      pageSize,
      search,
      includeInactive,
    ],
    queryFn: () =>
      getAllMasterHeartStationProceduresAction({
        pageNumber,
        pageSize,
        search: search || undefined,
        includeInactive,
      }),
  });

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;

    try {
      await deleteMasterHeartStationProcedureAction({ id: deleteId });
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPageNumber(1);
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <DialogTitle>Add Master Heart Station Procedure</DialogTitle>
            </DialogHeader>
            <MasterProcedureForm
              type="heart_station"
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
              <TableHead>RVS Code</TableHead>
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
                  <TableCell className="font-mono text-sm">
                    {procedure.rvsCode || "-"}
                  </TableCell>
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
                          <DialogTitle>Edit Heart Station Procedure</DialogTitle>
                        </DialogHeader>
                        <MasterProcedureForm
                          type="heart_station"
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
            {Array.from(
              { length: Math.min(data.totalPages, 10) },
              (_, i) => {
                const page = pageNumber <= 5 ? i + 1 : pageNumber - 4 + i;
                if (page > data.totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={pageNumber === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPageNumber(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              }
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
