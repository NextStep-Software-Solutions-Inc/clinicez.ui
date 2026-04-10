"use client";

import React, { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  FileUp,
  X,
  Loader2,
  ClipboardList,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  Upload,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import type { GetMyOrgMembership } from "@/actions/organizations/org-member.action";
import {
  stageRequirementFileUploadAction,
  linkRequirementFilesAction,
  deleteOrgMemberRequirementFileAction,
} from "@/actions/organizations/org-member-requirement-file.action";
import {
  isFileUploadRequirement,
  parseRequirementSettings,
  isRequirementRequired,
  type StagedRequirementFile,
} from "@/lib/requirement-types";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */

type MembershipData = NonNullable<NonNullable<GetMyOrgMembership["data"]>>;
type RequirementFile = MembershipData["OrgMemberRequirementFiles"][number];

/* ─────────────────────────────────────────────────────────── */
/*  Constants / helpers                                         */
/* ─────────────────────────────────────────────────────────── */

const REQUIREMENT_STUDENT_RECORD = "student_record";
const REQUIREMENT_EMPLOYEE_RECORD = "employee_record";

const REQUIREMENT_LABEL_MAP: Record<string, string> = {
  student_record: "Student Record",
  employee_record: "Employee Record",
  medical_certificate: "Medical Certificate",
  xray_result: "X-Ray Result",
  other: "Supporting Document",
};

function formatRequirementLabel(req: string): string {
  return (
    REQUIREMENT_LABEL_MAP[req] ??
    req.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  PENDING: { label: "Pending Review", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  INACTIVE: { label: "Inactive", variant: "outline" },
};

/* ─────────────────────────────────────────────────────────── */
/*  File Upload Subform                                         */
/* ─────────────────────────────────────────────────────────── */

interface FileUploadSubformProps {
  requirementType: string;
  orgUid: string;
  onUploaded: (staged: StagedRequirementFile) => void;
  onCancel: () => void;
}

function FileUploadSubform({ requirementType, orgUid, onUploaded, onCancel }: FileUploadSubformProps) {
  const [isUploading, startUpload] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) {
      toast.error("File size must not exceed 25 MB");
      return;
    }

    startUpload(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requirementType", requirementType);
      fd.append("orgUid", orgUid);
      const result = await stageRequirementFileUploadAction(fd);
      if (result.status && result.data) {
        onUploaded(result.data);
      } else {
        toast.error(result.message ?? "Upload failed. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          {formatRequirementLabel(requirementType)}
        </p>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <label
        className={`flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors text-sm ${
          isUploading
            ? "border-primary/40 bg-primary/5 cursor-not-allowed"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
          accept="image/*,.pdf,.doc,.docx"
        />
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <FileUp className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-muted-foreground">
          {isUploading ? "Uploading…" : "Click to select file (max 25 MB)"}
        </span>
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main component                                              */
/* ─────────────────────────────────────────────────────────── */

interface MyMembershipClientProps {
  membership: MembershipData;
  orgUid: string;
}

export default function MyMembershipClient({ membership, orgUid }: MyMembershipClientProps) {
  const [localFiles, setLocalFiles] = useState<RequirementFile[]>(
    membership.OrgMemberRequirementFiles
  );
  const [uploadingReq, setUploadingReq] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    mimeType: string | null;
  } | null>(null);
  const [, startTransition] = useTransition();

  // Keep localFiles in sync when membership prop changes (e.g., after page refresh)
  useEffect(() => {
    setLocalFiles(membership.OrgMemberRequirementFiles);
  }, [membership]);

  const requirements: string[] = membership.OrganizationRole.requirements ?? [];
  const requirementSettings = parseRequirementSettings(
    membership.OrganizationRole.requirementSettings
  );
  const studentRecord = membership.User.StudentRecords?.[0];
  const employment = membership.User.UserEmployments?.[0];
  const badge = STATUS_BADGE_CONFIG[membership.status] ?? STATUS_BADGE_CONFIG.INACTIVE;

  function isFulfilled(req: string): boolean {
    if (req === REQUIREMENT_STUDENT_RECORD) return studentRecord !== undefined;
    if (req === REQUIREMENT_EMPLOYEE_RECORD) return employment !== undefined;
    if (isFileUploadRequirement(req)) {
      return localFiles.some((f) => f.requirementType === req);
    }
    return false;
  }

  const allRequiredFulfilled = requirements.every((req) => {
    const required = isRequirementRequired(req, requirementSettings);
    if (!required) return true;
    return isFulfilled(req);
  });

  function handleFileUploaded(staged: StagedRequirementFile) {
    startTransition(async () => {
      const result = await linkRequirementFilesAction({
        orgMemberId: membership.id,
        files: [staged],
      });
      if (result.status) {
        // Optimistically add to local state
        const optimistic: RequirementFile = {
          id: -Date.now(),
          requirementType: staged.requirementType,
          createdAt: new Date(),
          File: {
            id: staged.fileId,
            name: staged.fileName,
            size: staged.fileSize,
            url: "",
            mimeType: null,
            createdAt: new Date(),
          },
        };
        setLocalFiles((prev) => [...prev, optimistic]);
        setUploadingReq(null);
        toast.success("Requirement file uploaded successfully.");
      } else {
        toast.error(result.message ?? "Failed to link file.");
      }
    });
  }

  function handleDeleteFile(fileRecordId: number) {
    setIsDeletingId(fileRecordId);
    startTransition(async () => {
      const result = await deleteOrgMemberRequirementFileAction(fileRecordId);
      if (result.status) {
        setLocalFiles((prev) => prev.filter((f) => f.id !== fileRecordId));
        toast.success("Requirement file removed.");
      } else {
        toast.error(result.message ?? "Failed to remove file.");
      }
      setIsDeletingId(null);
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* ── Status banner ── */}
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{membership.OrganizationRole.name}</p>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Applied {format(new Date(membership.createdAt), "MMMM d, yyyy")}
            </p>
            {membership.status === "ACTIVE" && membership.acceptedAt && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Approved{" "}
                {membership.AcceptedBy && (
                  <>
                    by{" "}
                    <span className="font-medium">
                      {[membership.AcceptedBy.firstName, membership.AcceptedBy.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </span>{" "}
                  </>
                )}
                on {format(new Date(membership.acceptedAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
          {!allRequiredFulfilled && membership.status === "PENDING" && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              Incomplete requirements
            </div>
          )}
        </div>

        {/* ── Requirements checklist ── */}
        {requirements.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Requirements
            </p>
            <div className="space-y-2">
              {requirements.map((req) => {
                const fulfilled = isFulfilled(req);
                const optional = !isRequirementRequired(req, requirementSettings);
                return (
                  <div
                    key={req}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${
                      fulfilled
                        ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20"
                        : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
                    }`}
                  >
                    {fulfilled ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {formatRequirementLabel(req)}
                        {optional && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            Optional
                          </Badge>
                        )}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          fulfilled
                            ? "text-green-700 dark:text-green-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {fulfilled ? "Submitted" : "Not yet submitted"}
                      </p>
                      {/* For student/employee record, show a hint about where to update */}
                      {!fulfilled &&
                        (req === REQUIREMENT_STUDENT_RECORD ||
                          req === REQUIREMENT_EMPLOYEE_RECORD) && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Info className="h-3 w-3 flex-shrink-0" />
                            Update via your{" "}
                            <Link
                              href="/v2/profile/edit"
                              className="text-primary hover:underline"
                            >
                              profile settings
                            </Link>
                          </p>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* ── Uploaded requirement files ── */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Submitted Files
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {localFiles.length === 0 && uploadingReq === null && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No files uploaded yet.
              </p>
            )}

            {localFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-md border p-2.5"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground capitalize">
                    {formatRequirementLabel(f.requirementType)}
                  </p>
                  <p className="text-sm font-medium truncate">{f.File.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.File.size / 1024).toFixed(1)} KB ·{" "}
                    {format(new Date(f.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.File.url && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFile({
                          url: f.File.url,
                          name: f.File.name,
                          mimeType: f.File.mimeType,
                        })
                      }
                      className="text-primary hover:underline text-xs"
                    >
                      View
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(f.id)}
                    disabled={isDeletingId === f.id}
                    className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                    title="Remove file"
                  >
                    {isDeletingId === f.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* ── Upload new file ── */}
            {requirements.filter(isFileUploadRequirement).length > 0 && (
              <div className="pt-2 border-t space-y-2">
                {uploadingReq === null ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      Upload a requirement file
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {requirements.filter(isFileUploadRequirement).map((req) => (
                        <Button
                          key={req}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setUploadingReq(req)}
                        >
                          <FileUp className="h-3 w-3" />
                          {formatRequirementLabel(req)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <FileUploadSubform
                    requirementType={uploadingReq}
                    orgUid={orgUid}
                    onUploaded={handleFileUploaded}
                    onCancel={() => setUploadingReq(null)}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Student record ── */}
        {studentRecord && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Student Record
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student ID</span>
                <span className="font-medium">{studentRecord.studentId}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Employment record ── */}
        {employment && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment Record
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium">{employment.employeeId}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Terms & Privacy Policy ── */}
        <div className="rounded-lg border p-4 space-y-2.5">
          <p className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Terms &amp; Privacy Policy
          </p>
          <p className="text-xs text-muted-foreground">
            By submitting your application, you have agreed to the
            organization&apos;s Terms &amp; Conditions and Privacy Policy.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={membership.Organization.termsAndConditionsUrl ?? "/terms"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Terms &amp; Conditions
            </Link>
            <Link
              href={membership.Organization.privacyPolicyUrl ?? "/privacy"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* ── File Preview Dialog ── */}
      <Dialog
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="mt-2 overflow-auto max-h-[70vh]">
              {previewFile.mimeType?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full rounded"
                />
              ) : previewFile.mimeType === "application/pdf" ? (
                <iframe
                  src={previewFile.url}
                  title={previewFile.name}
                  className="w-full h-[65vh] rounded border"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Preview not available.
                  </p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
