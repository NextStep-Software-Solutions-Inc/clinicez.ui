"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  deleteICD10CodesAction,
  type GetAllICD10Codes,
} from "@/actions/super-admin/diagnostics-procedures.action";

type ICD10CodeRow = NonNullable<GetAllICD10Codes["data"][number]>;

const PAGE_SIZE_OPTIONS = [20, 50, 100, 500, 1000, 5000, 10000];

export function MasterICD10CodesTable() {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  /** id of a single row queued for deletion */
  const [deleteId, setDeleteId] = useState<number | null>(null);
  /** selected row ids */
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  /** batch delete confirmation open */
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["master-icd10-codes", pageNumber, pageSize, search, includeInactive],
    queryFn: () =>
      getAllICD10CodesAction({
        pageNumber,
        pageSize,
        search: search || undefined,
        includeInactive,
      }),
  });

  const pageIds = useMemo(
    () => (data?.data ?? []).map((r: ICD10CodeRow) => r.id),
    [data],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageSelected, pageIds]);

  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteICD10CodeAction({ id: deleteId });
      toast.success("ICD-10 code deleted successfully");
      setDeleteId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteId);
        return next;
      });
      void refetch();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete ICD-10 code"));
    }
  }, [deleteId, refetch]);

  const handleBatchDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      const result = await deleteICD10CodesAction({ ids });
      toast.success(`${result.deleted} ICD-10 code${result.deleted === 1 ? "" : "s"} deleted`);
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
      void refetch();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete ICD-10 codes"));
    }
  }, [selectedIds, refetch]);

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  const selectedCount = selectedIds.size;

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
      </div>

      {/* Batch action toolbar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-2 text-sm">
          <span className="flex-1 font-medium">
            {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBatchDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all on this page"
                />
              </TableHead>
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
                <TableRow
                  key={code.id}
                  data-state={selectedIds.has(code.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(code.id)}
                      onCheckedChange={() => toggleRow(code.id)}
                      aria-label={`Select ${code.code}`}
                    />
                  </TableCell>
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
                  colSpan={7}
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

      {/* Single-row delete confirmation */}
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

      {/* Batch delete confirmation */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete {selectedCount} ICD-10 Code{selectedCount === 1 ? "" : "s"}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the {selectedCount} selected ICD-10 code{selectedCount === 1 ? "" : "s"}? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete}>
              Delete {selectedCount} code{selectedCount === 1 ? "" : "s"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
