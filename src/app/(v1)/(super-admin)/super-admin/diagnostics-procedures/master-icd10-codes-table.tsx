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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  getAllICD10CodesAction,
  deleteICD10CodeAction,
  type GetAllICD10Codes,
} from "@/actions/super-admin/diagnostics-procedures.action";

type ICD10CodeRow = NonNullable<GetAllICD10Codes["data"][number]>;

export function MasterICD10CodesTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const pageSize = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["master-icd10-codes", pageNumber, search, includeInactive],
    queryFn: () =>
      getAllICD10CodesAction({
        pageNumber,
        pageSize,
        search: search || undefined,
        includeInactive,
      }),
  });

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteICD10CodeAction({ id: deleteId });
      toast.success("ICD-10 code deleted successfully");
      setDeleteId(null);
      void refetch();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete ICD-10 code"));
    }
  }, [deleteId, refetch]);

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search code, description, or category..."
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
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-mono">Code</TableHead>
              <TableHead>Short Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>HIPAA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data && data.data.length > 0 ? (
              data.data.map((code: ICD10CodeRow) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-semibold text-primary">
                    {code.code}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {code.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {code.category ?? "-"}
                  </TableCell>
                  <TableCell>
                    {code.hippaCovered && (
                      <Badge variant="outline" className="text-[10px]">
                        HIPAA
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.isActive ? "default" : "secondary"}>
                      {code.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(code.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No ICD-10 codes found. Import codes using the Import button
                  above.
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

      <div className="text-xs text-muted-foreground text-center">
        {(data?.total ?? 0).toLocaleString()} total codes
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete ICD-10 Code</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete this ICD-10 code? This
            action cannot be undone.
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
