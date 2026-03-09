"use client";

import { useState } from "react";
import {
  GetAllVerificationRequests,
  getAllVerificationRequestsAction,
  approveVerificationRequestAction,
  rejectVerificationRequestAction,
} from "@actions/super-admin/verification.action";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Search, CheckCircle, XCircle, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { formatDistance } from "date-fns";
import type { VerificationStatus } from "@prisma/client";
import Image from "next/image";

interface VerificationRequestsTableProps {
  initialData: GetAllVerificationRequests;
}

type VerificationRequestItem = GetAllVerificationRequests["data"][number];

interface ImagePreview {
  url: string;
  label: string;
}

export default function VerificationRequestsTable({ initialData }: VerificationRequestsTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);

  const loadData = async (page = 1, searchTerm = search, filterStatus = statusFilter) => {
    setIsLoading(true);
    try {
      const result = await getAllVerificationRequestsAction({
        search: searchTerm || undefined,
        status: filterStatus === "ALL" ? undefined : filterStatus,
        pageNumber: page,
        pageSize: data.pageSize,
      });
      setData(result);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load verification requests"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData(1, search);
  };

  const handleFilterChange = (value: string) => {
    const newFilter = value as VerificationStatus | "ALL";
    setStatusFilter(newFilter);
    loadData(1, search, newFilter);
  };

  const handleViewRequest = (request: VerificationRequestItem) => {
    setSelectedRequest(request);
    setReviewerNotes("");
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await approveVerificationRequestAction({
        requestId: selectedRequest.id,
        reviewerNotes: reviewerNotes || undefined,
      });
      toast.success("Verification request approved successfully");
      setReviewDialogOpen(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to approve verification request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    if (!reviewerNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsSubmitting(true);
    try {
      await rejectVerificationRequestAction({
        requestId: selectedRequest.id,
        reviewerNotes,
      });
      toast.success("Verification request rejected");
      setReviewDialogOpen(false);
      loadData(data.pageNumber);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to reject verification request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case "PENDING":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending Review</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} size="icon" variant="outline" disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="VERIFIED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No verification requests found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.User.firstName} {request.User.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{request.User.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.VerificationDocuments.length} document{request.VerificationDocuments.length !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistance(new Date(request.createdAt), new Date(), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.Reviewer
                      ? `${request.Reviewer.firstName} ${request.Reviewer.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewRequest(request)}
                      title="Review verification request"
                    >
                      <Eye className="h-4 w-4" />
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
            {Math.min(data.pageNumber * data.pageSize, data.total)} of {data.total} requests
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              Review the submitted documents and approve or reject the verification request.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedRequest.User.firstName} {selectedRequest.User.lastName}</p>
                  <p className="text-xs text-muted-foreground">{selectedRequest.User.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Submitted Documents</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.VerificationDocuments.map((doc) => (
                    <div key={doc.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm">{doc.ValidIDType.name}</span>
                        <Badge variant="outline">{doc.ValidIDType.level}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {(
                          [
                            { label: "ID Photo", url: doc.idPhotoUrl },
                            { label: "Selfie with ID", url: doc.selfieWithIdUrl },
                            { label: "Selfie without ID", url: doc.selfieWithoutIdUrl },
                          ] as const
                        ).map(({ label, url }) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={`View ${label}`}
                            onClick={() => setImagePreview({ url, label })}
                            className="group flex flex-col items-center gap-1.5 focus:outline-none"
                          >
                            <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group-hover:ring-2 group-hover:ring-blue-400 group-focus:ring-2 group-focus:ring-blue-400 transition-all">
                              <Image
                                src={url}
                                alt={label}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {selectedRequest.VerificationDocuments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No documents submitted.</p>
                  )}
                </div>
              </div>

              {selectedRequest.reviewerNotes && (
                <div>
                  <Label className="text-sm font-medium">Previous Reviewer Notes</Label>
                  <p className="text-sm mt-1 p-2 bg-muted rounded-md">{selectedRequest.reviewerNotes}</p>
                </div>
              )}

              {selectedRequest.status === "PENDING" && (
                <div>
                  <Label htmlFor="reviewerNotes">Reviewer Notes</Label>
                  <Textarea
                    id="reviewerNotes"
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Add notes about this review (required for rejection)..."
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Close
            </Button>
            {selectedRequest?.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(open) => { if (!open) setImagePreview(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0">
          <div className="relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image label */}
            {imagePreview && (
              <p className="absolute top-3 left-4 z-10 text-sm font-medium text-white/90 drop-shadow">
                {imagePreview.label}
              </p>
            )}

            {/* Image */}
            {imagePreview && (
              <div className="relative w-full min-h-[300px] max-h-[80vh]">
                <Image
                  src={imagePreview.url}
                  alt={imagePreview.label}
                  width={1200}
                  height={900}
                  sizes="100vw"
                  className="w-full h-auto object-contain max-h-[80vh]"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
