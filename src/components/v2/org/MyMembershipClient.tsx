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
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
  REQUIREMENT_STUDENT_RECORD,
  REQUIREMENT_EMPLOYEE_RECORD,
  formatRequirementLabel,
  type StagedRequirementFile,
} from "@/lib/requirement-types";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertStudentRecordAction } from "@/actions/student-record.action";
import { upsertEmploymentRecordAction } from "@/actions/employee-record.action";
import { useStudentLevels } from "@/hooks/useStudentLevel";
import { useOrgYearLevels } from "@/hooks/useOrgYearLevel";
import { useOrgPrograms } from "@/hooks/useOrgProgram";
import { useOrgColleges } from "@/hooks/useOrgCollege";
import { useOrgDepartments } from "@/hooks/useOrgDepartment";
import { useOrgOffices } from "@/hooks/useOrgOffice";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */

type MembershipData = NonNullable<NonNullable<GetMyOrgMembership["data"]>>;
type RequirementFile = MembershipData["OrgMemberRequirementFiles"][number];

/* ─────────────────────────────────────────────────────────── */
/*  Constants / helpers                                         */
/* ─────────────────────────────────────────────────────────── */

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
      try {
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
      } catch (err) {
        console.error("[MyMembership] Stage upload error:", err);
        toast.error("Upload failed. Please try again.");
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
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { data: studentLevels } = useStudentLevels();
  const { data: orgYearLevels } = useOrgYearLevels(orgUid);
  const { data: orgPrograms } = useOrgPrograms(orgUid);
  const { data: orgColleges } = useOrgColleges(orgUid);
  const { data: orgDepartments } = useOrgDepartments(orgUid);
  const { data: orgOffices } = useOrgOffices(orgUid);

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
  const tempIdCounter = React.useRef(-1);

  // Profile dialog state
  const [profileDialogReq, setProfileDialogReq] = useState<
    typeof REQUIREMENT_STUDENT_RECORD | typeof REQUIREMENT_EMPLOYEE_RECORD | null
  >(null);
  // Student record fields
  const [studentIdInput, setStudentIdInput] = useState("");
  const [lrnInput, setLrnInput] = useState("");
  const [levelIdInput, setLevelIdInput] = useState<string>("");
  const [yearLevelIdInput, setYearLevelIdInput] = useState<string>("");
  const [programIdInput, setProgramIdInput] = useState<string>("");
  const [isStudentCollege, setIsStudentCollege] = useState(false);
  const [studentCollegeIdInput, setStudentCollegeIdInput] = useState<string>("");
  const [studentDepartmentIdInput, setStudentDepartmentIdInput] = useState<string>("");
  // Employee record fields
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [designationInput, setDesignationInput] = useState("");
  const [officeIdInput, setOfficeIdInput] = useState<string>("");
  const [employeeDepartmentIdInput, setEmployeeDepartmentIdInput] = useState<string>("");
  const [isEmployeeCollege, setIsEmployeeCollege] = useState(false);
  const [employeeCollegeIdInput, setEmployeeCollegeIdInput] = useState<string>("");

  const [isSubmittingProfile, startProfileSubmit] = useTransition();

  // Keep localFiles in sync when membership prop changes (e.g., after page refresh)
  useEffect(() => {
    setLocalFiles(membership.OrgMemberRequirementFiles);
  }, [membership]);

  // Pre-fill dialog fields when opening
  function openProfileDialog(req: typeof REQUIREMENT_STUDENT_RECORD | typeof REQUIREMENT_EMPLOYEE_RECORD) {
    if (req === REQUIREMENT_STUDENT_RECORD) {
      const sr = membership.User.StudentRecords?.[0];
      setStudentIdInput(sr?.studentId ?? "");
      setLrnInput(sr?.lrn ?? "");
      setLevelIdInput(String(sr?.level ?? ""));
      setYearLevelIdInput(String(sr?.yearLevel ?? ""));
      setProgramIdInput(String(sr?.programId ?? ""));
      setIsStudentCollege(!!sr?.collegeId);
      setStudentCollegeIdInput(String(sr?.collegeId ?? ""));
      setStudentDepartmentIdInput(String(sr?.departmentId ?? ""));
    } else {
      const emp = membership.User.UserEmployments?.[0];
      setEmployeeIdInput(emp?.employeeId ?? "");
      setPositionInput(emp?.position ?? "");
      setDesignationInput(emp?.designation ?? "");
      setOfficeIdInput(String(emp?.officeId ?? ""));
      setEmployeeDepartmentIdInput(String(emp?.departmentId ?? ""));
      setIsEmployeeCollege(!!emp?.collegeId);
      setEmployeeCollegeIdInput(String(emp?.collegeId ?? ""));
    }
    setProfileDialogReq(req);
  }

  function closeProfileDialog() {
    setProfileDialogReq(null);
  }

  function handleProfileFormSubmit() {
    const userId = clerkUser?.id;
    if (!userId) {
      toast.error("User not authenticated.");
      return;
    }

    startProfileSubmit(async () => {
      if (profileDialogReq === REQUIREMENT_STUDENT_RECORD) {
        if (!studentIdInput.trim()) {
          toast.error("Student ID is required.");
          return;
        }
        if (!levelIdInput) {
          toast.error("Student level is required.");
          return;
        }
        const result = await upsertStudentRecordAction({
          userId,
          orgUid,
          studentId: studentIdInput.trim(),
          levelId: Number(levelIdInput),
          lrn: lrnInput.trim() || undefined,
          yearLevelId: yearLevelIdInput ? Number(yearLevelIdInput) : undefined,
          programId: programIdInput ? Number(programIdInput) : undefined,
          collegeId: isStudentCollege && studentCollegeIdInput ? Number(studentCollegeIdInput) : undefined,
          departmentId: isStudentCollege && studentDepartmentIdInput ? Number(studentDepartmentIdInput) : undefined,
        });
        if (result?.status) {
          toast.success("Student record updated successfully.");
          closeProfileDialog();
          router.refresh();
        } else {
          toast.error(result?.message ?? "Failed to update student record.");
        }
      } else if (profileDialogReq === REQUIREMENT_EMPLOYEE_RECORD) {
        if (!employeeIdInput.trim()) {
          toast.error("Employee ID is required.");
          return;
        }
        if (!positionInput.trim()) {
          toast.error("Position is required.");
          return;
        }
        const result = await upsertEmploymentRecordAction({
          userId,
          orgUid,
          employeeId: employeeIdInput.trim(),
          position: positionInput.trim(),
          designation: designationInput.trim() || undefined,
          officeId: officeIdInput ? Number(officeIdInput) : undefined,
          departmentId: employeeDepartmentIdInput ? Number(employeeDepartmentIdInput) : undefined,
          collegeId: isEmployeeCollege && employeeCollegeIdInput ? Number(employeeCollegeIdInput) : undefined,
        });
        if (result?.status) {
          toast.success("Employment record updated successfully.");
          closeProfileDialog();
          router.refresh();
        } else {
          toast.error(result?.message ?? "Failed to update employment record.");
        }
      }
    });
  }

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
      try {
        const result = await linkRequirementFilesAction({
          orgMemberId: membership.id,
          files: [staged],
        });
        if (result.status) {
          // Optimistically add to local state
          const tempId = --tempIdCounter.current;
          const optimistic: RequirementFile = {
            id: tempId,
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
      } catch (err) {
        console.error("[MyMembership] Link file error:", err);
        toast.error("Failed to link file. Please try again.");
      }
    });
  }

  function handleDeleteFile(fileRecordId: number) {
    setIsDeletingId(fileRecordId);
    startTransition(async () => {
      try {
        const result = await deleteOrgMemberRequirementFileAction(fileRecordId);
        if (result.status) {
          setLocalFiles((prev) => prev.filter((f) => f.id !== fileRecordId));
          toast.success("Requirement file removed.");
        } else {
          toast.error(result.message ?? "Failed to remove file.");
        }
      } catch (err) {
        console.error("[MyMembership] Delete file error:", err);
        toast.error("Failed to remove file. Please try again.");
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
                const isProfileReq =
                  req === REQUIREMENT_STUDENT_RECORD || req === REQUIREMENT_EMPLOYEE_RECORD;
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
                      {/* Requirement label — visually distinct heading */}
                      <p className="text-sm font-semibold leading-tight flex items-center gap-1.5">
                        {formatRequirementLabel(req)}
                        {optional && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            Optional
                          </Badge>
                        )}
                      </p>
                      {/* Status line — muted, smaller */}
                      <p
                        className={`text-xs mt-1 font-normal ${
                          fulfilled
                            ? "text-green-700 dark:text-green-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {fulfilled ? "Submitted" : "Not yet submitted"}
                      </p>

                      {/* Task 3: Not-fulfilled profile requirements — open inline dialog instead of link */}
                      {!fulfilled && isProfileReq && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary mt-1"
                          onClick={() =>
                            openProfileDialog(
                              req as
                                | typeof REQUIREMENT_STUDENT_RECORD
                                | typeof REQUIREMENT_EMPLOYEE_RECORD
                            )
                          }
                        >
                          Fill in{" "}
                          {req === REQUIREMENT_STUDENT_RECORD
                            ? "your Student ID"
                            : "your Employee details"}
                        </Button>
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
            {requirements.filter(isFileUploadRequirement).some(
              (req) => !localFiles.some((f) => f.requirementType === req)
            ) && (
              <div className="pt-2 border-t space-y-2">
                {uploadingReq === null ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      Upload a requirement file
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {requirements
                        .filter(isFileUploadRequirement)
                        .filter(
                          (req) => !localFiles.some((f) => f.requirementType === req)
                        )
                        .map((req) => (
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
                <button
                  type="button"
                  title="Edit student record"
                  onClick={() => openProfileDialog(REQUIREMENT_STUDENT_RECORD)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Student ID</span>
                <span className="font-medium">{studentRecord.studentId}</span>
              </div>
              {studentRecord.lrn && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Learner Ref. No.</span>
                  <span className="font-medium">{studentRecord.lrn}</span>
                </div>
              )}
              {studentRecord.Level && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-medium">{studentRecord.Level.name}</span>
                </div>
              )}
              {studentRecord.OrganizationYearLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year/Grade Level</span>
                  <span className="font-medium">{studentRecord.OrganizationYearLevel.name}</span>
                </div>
              )}
              {studentRecord.Program && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Program</span>
                  <span className="font-medium">{studentRecord.Program.name}</span>
                </div>
              )}
              {studentRecord.College && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">College</span>
                  <span className="font-medium">{studentRecord.College.name}</span>
                </div>
              )}
              {studentRecord.Department && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{studentRecord.Department.name}</span>
                </div>
              )}
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
                <button
                  type="button"
                  title="Edit employment record"
                  onClick={() => openProfileDialog(REQUIREMENT_EMPLOYEE_RECORD)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium">{employment.employeeId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium">{employment.position}</span>
              </div>
              {employment.designation && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Designation</span>
                  <span className="font-medium">{employment.designation}</span>
                </div>
              )}
              {employment.Office && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Office</span>
                  <span className="font-medium">{employment.Office.name}</span>
                </div>
              )}
              {employment.Department && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{employment.Department.name}</span>
                </div>
              )}
              {employment.College && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">College</span>
                  <span className="font-medium">{employment.College.name}</span>
                </div>
              )}
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

      {/* ── Profile Data Dialog ── */}
      <Dialog open={profileDialogReq !== null} onOpenChange={(open) => !open && closeProfileDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {profileDialogReq === REQUIREMENT_STUDENT_RECORD
                ? "Student Record"
                : "Employment Record"}
            </DialogTitle>
            <DialogDescription>
              {profileDialogReq === REQUIREMENT_STUDENT_RECORD
                ? "Enter your student details to fulfill this requirement."
                : "Enter your employment details to fulfill this requirement."}
            </DialogDescription>
          </DialogHeader>

          {profileDialogReq === REQUIREMENT_STUDENT_RECORD && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="student-id">Student ID <span className="text-destructive">*</span></Label>
                  <Input
                    id="student-id"
                    placeholder="e.g. 2024-00001"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    disabled={isSubmittingProfile}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student-lrn">Learner Ref. Number <span className="text-muted-foreground text-xs">(if applicable)</span></Label>
                  <Input
                    id="student-lrn"
                    placeholder="e.g. 123456789012"
                    value={lrnInput}
                    onChange={(e) => setLrnInput(e.target.value)}
                    disabled={isSubmittingProfile}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="student-level">Student Level <span className="text-destructive">*</span></Label>
                <Select value={levelIdInput} onValueChange={setLevelIdInput} disabled={isSubmittingProfile}>
                  <SelectTrigger id="student-level">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent>
                    {(studentLevels ?? []).map((level) => (
                      <SelectItem key={level.id} value={String(level.id)}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="year-level">Year/Grade Level</Label>
                  <Select value={yearLevelIdInput} onValueChange={setYearLevelIdInput} disabled={isSubmittingProfile}>
                    <SelectTrigger id="year-level">
                      <SelectValue placeholder="Select a year/grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgYearLevels ?? []).map((yl) => (
                        <SelectItem key={yl.id} value={String(yl.id)}>
                          {yl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="program">Program</Label>
                  <Select value={programIdInput} onValueChange={setProgramIdInput} disabled={isSubmittingProfile}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgPrograms ?? []).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-college-student"
                  checked={isStudentCollege}
                  onCheckedChange={(checked) => setIsStudentCollege(!!checked)}
                  disabled={isSubmittingProfile}
                />
                <Label htmlFor="is-college-student" className="cursor-pointer">I am a college student.</Label>
              </div>
              {isStudentCollege && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="student-college">College <span className="text-muted-foreground text-xs">(if applicable)</span></Label>
                    <Select value={studentCollegeIdInput} onValueChange={setStudentCollegeIdInput} disabled={isSubmittingProfile}>
                      <SelectTrigger id="student-college">
                        <SelectValue placeholder="Select a college" />
                      </SelectTrigger>
                      <SelectContent>
                        {(orgColleges ?? []).map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="student-department">Department</Label>
                    <Select value={studentDepartmentIdInput} onValueChange={setStudentDepartmentIdInput} disabled={isSubmittingProfile}>
                      <SelectTrigger id="student-department">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {(orgDepartments ?? []).map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {profileDialogReq === REQUIREMENT_EMPLOYEE_RECORD && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="employee-id">Employee ID <span className="text-destructive">*</span></Label>
                  <Input
                    id="employee-id"
                    placeholder="e.g. EMP-00001"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
                    disabled={isSubmittingProfile}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="position">Position <span className="text-destructive">*</span></Label>
                  <Input
                    id="position"
                    placeholder="e.g. Nurse, Doctor, Staff"
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    disabled={isSubmittingProfile}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designation">Designation <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Staff"
                  value={designationInput}
                  onChange={(e) => setDesignationInput(e.target.value)}
                  disabled={isSubmittingProfile}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="office">Office</Label>
                  <Select value={officeIdInput} onValueChange={setOfficeIdInput} disabled={isSubmittingProfile}>
                    <SelectTrigger id="office">
                      <SelectValue placeholder="Select an office" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgOffices ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emp-department">Department <span className="text-muted-foreground text-xs">(if applicable)</span></Label>
                  <Select value={employeeDepartmentIdInput} onValueChange={setEmployeeDepartmentIdInput} disabled={isSubmittingProfile}>
                    <SelectTrigger id="emp-department">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgDepartments ?? []).map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-college-employee"
                  checked={isEmployeeCollege}
                  onCheckedChange={(checked) => setIsEmployeeCollege(!!checked)}
                  disabled={isSubmittingProfile}
                />
                <Label htmlFor="is-college-employee" className="cursor-pointer">I work in a College/University institution.</Label>
              </div>
              {isEmployeeCollege && (
                <div className="space-y-1.5">
                  <Label htmlFor="emp-college">College <span className="text-muted-foreground text-xs">(if applicable)</span></Label>
                  <Select value={employeeCollegeIdInput} onValueChange={setEmployeeCollegeIdInput} disabled={isSubmittingProfile}>
                    <SelectTrigger id="emp-college">
                      <SelectValue placeholder="Select a college" />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgColleges ?? []).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeProfileDialog} disabled={isSubmittingProfile}>
              Cancel
            </Button>
            <Button onClick={handleProfileFormSubmit} disabled={isSubmittingProfile}>
              {isSubmittingProfile ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
