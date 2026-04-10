"use client";

import React, {
  useCallback,
  useState,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  UserCircle,
  UserPlus,
  UserCog,
  PowerOff,
  Loader2,
  ClipboardList,
  Eye,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  ShieldX,
  Mail,
  Phone,
  Calendar,
  Info,
  ExternalLink,
  ShieldCheck,
  FileUp,
  FileText,
  X,
  MapPin,
  HeartPulse,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getOrgMembersAction,
  setMembershipRequestStatusAction,
  deleteMembershipAction,
  searchUsersForOrgAction,
  updateOrgMemberRoleAction,
  resetOrgMemberPermissionsAction,
  type GetOrgMembers,
  type SearchUsersForOrg,
} from "@/actions/organizations/org-member.action";
import { joinOrganizationAction } from "@/actions/organizations/join-organization.action";
import type { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";
import type { OrganizationMemberStatus } from "@/types";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { upsertStudentRecordAction } from "@/actions/student-record.action";
import { upsertEmploymentRecordAction } from "@/actions/employee-record.action";
import { useOrgYearLevels } from "@/hooks/useOrgYearLevel";
import { useStudentLevels } from "@/hooks/useStudentLevel";
import { useOrgPrograms } from "@/hooks/useOrgProgram";
import { useOrgColleges } from "@/hooks/useOrgCollege";
import { useOrgDepartments } from "@/hooks/useOrgDepartment";
import { useOrgOffices } from "@/hooks/useOrgOffice";
import {
  stageRequirementFileUploadAction,
  linkRequirementFilesAction,
} from "@/actions/organizations/org-member-requirement-file.action";
import { isFileUploadRequirement, parseRequirementSettings, isRequirementRequired, type StagedRequirementFile } from "@/lib/requirement-types";

/* ─────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ─────────────────────────────────────────────────────────── */

type OrgMember = NonNullable<NonNullable<GetOrgMembers["data"]>["data"]>[number];
type OrgRole = NonNullable<NonNullable<GetOrganizationRoles["data"]>>[number];
type UserResult = NonNullable<NonNullable<SearchUsersForOrg["data"]>>[number];

export interface OrgMembersClientProps {
  orgUid: string;
  initialMembers: OrgMember[];
  initialTotal: number;
  initialNextCursor: number | null;
  initialHasMore: boolean;
  roles: OrgRole[];
  pageSize?: number;
}

/* ─────────────────────────────────────────────────────────── */
/*  Constants                                                   */
/* ─────────────────────────────────────────────────────────── */

const STATUS_OPTIONS: { label: string; value: OrganizationMemberStatus | "ALL" }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Inactive", value: "INACTIVE" },
];

const STATUS_BADGE: Record<
  OrganizationMemberStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Active", variant: "default" },
  PENDING: { label: "Pending", variant: "secondary" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
  INACTIVE: { label: "Inactive", variant: "outline" },
};

/* ─────────────────────────────────────────────────────────── */
/*  Helpers                                                     */
/* ─────────────────────────────────────────────────────────── */

function getInitials(firstName: string | null, lastName: string | null): string {
  return ((firstName?.charAt(0) ?? "") + (lastName?.charAt(0) ?? "")).toUpperCase() || "?";
}

function getFullName(
  firstName: string | null,
  lastName: string | null,
  suffix?: string | null
): string {
  const parts = [firstName, lastName].filter(Boolean).join(" ");
  return suffix ? `${parts} ${suffix}` : parts || "Unknown User";
}

/* ─────────────────────────────────────────────────────────── */
/*  Requirement constants + helpers                             */
/* ─────────────────────────────────────────────────────────── */

const REQUIREMENT_STUDENT_RECORD = "student_record";
const REQUIREMENT_EMPLOYEE_RECORD = "employee_record";
const REQUIREMENT_MEDICAL_CERTIFICATE = "medical_certificate";
const REQUIREMENT_XRAY_RESULT = "xray_result";
const REQUIREMENT_OTHER = "other";

/** Human-readable labels for known requirement keys */
const REQUIREMENT_LABEL_MAP: Record<string, string> = {
  [REQUIREMENT_STUDENT_RECORD]: "Student Record",
  [REQUIREMENT_EMPLOYEE_RECORD]: "Employee Record",
  [REQUIREMENT_MEDICAL_CERTIFICATE]: "Medical Certificate",
  [REQUIREMENT_XRAY_RESULT]: "X-Ray Result",
  [REQUIREMENT_OTHER]: "Supporting Document",
};

function formatRequirementLabel(req: string): string {
  return (
    REQUIREMENT_LABEL_MAP[req] ??
    req.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

function formatBloodType(bt: string): string {
  return bt
    .replace("_POSITIVE", "+")
    .replace("_NEGATIVE", "-")
    .replace("RH", "Rh");
}

function formatCivilStatus(cs: string): string {
  return cs.charAt(0) + cs.slice(1).toLowerCase();
}

/* ─────────────────────────────────────────────────────────── */
/*  Admin requirement sub-form schemas                         */
/* ─────────────────────────────────────────────────────────── */

const adminStudentRecordSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  lrn: z.string().optional(),
  levelId: z.coerce.number({ required_error: "School level is required" }),
  yearLevelId: z.coerce.number({ required_error: "Year level is required" }),
  programId: z.coerce.number({ required_error: "Program is required" }),
  isCollege: z.boolean().default(false),
  collegeId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
});
type AdminStudentRecordValues = z.infer<typeof adminStudentRecordSchema>;

const adminEmployeeRecordSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  position: z.string().min(1, "Position is required"),
  designation: z.string().optional(),
  officeId: z.coerce.number({ required_error: "Office is required" }),
  departmentId: z.coerce.number().optional(),
  isCollege: z.boolean().default(false),
  collegeId: z.coerce.number().optional(),
});
type AdminEmployeeRecordValues = z.infer<typeof adminEmployeeRecordSchema>;

/* ─────────────────────────────────────────────────────────── */
/*  Member Application Sheet (view filled requirements)        */
/* ─────────────────────────────────────────────────────────── */

interface MemberApplicationSheetProps {
  member: OrgMember | null;
  onClose: () => void;
}

function MemberApplicationSheet({ member, onClose }: MemberApplicationSheetProps) {
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    mimeType: string | null;
  } | null>(null);

  if (!member) return null;

  const requirements: string[] = member.OrganizationRole.requirements ?? [];
  const requirementSettings = parseRequirementSettings(member.OrganizationRole.requirementSettings);

  const studentRecord = member.User.StudentRecords?.[0];
  const employment = member.User.UserEmployments?.[0];
  const addresses = member.User.UserAddresses ?? [];
  const emergencyContacts = member.User.UserEmergencyContacts ?? [];
  const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);
  const initials = getInitials(member.User.firstName, member.User.lastName);
  const status = member.status as OrganizationMemberStatus;

  const requirementFiles = member.OrgMemberRequirementFiles ?? [];

  function isFulfilled(req: string): boolean {
    if (req === REQUIREMENT_STUDENT_RECORD) return studentRecord !== undefined;
    if (req === REQUIREMENT_EMPLOYEE_RECORD) return employment !== undefined;
    if (isFileUploadRequirement(req)) {
      return requirementFiles.some((f) => f.requirementType === req);
    }
    return false;
  }

  return (
    <>
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:w-1/2 sm:max-w-none flex flex-col gap-0 p-0 overflow-y-auto">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Member Details
          </SheetTitle>
          <SheetDescription>
            Application review for <span className="font-medium text-foreground">{fullName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-6">
          {/* ── Applicant overview ── */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={member.User.picture ?? undefined} alt={fullName} />
              <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{fullName}</p>
              <p className="text-sm text-muted-foreground">{member.OrganizationRole.name}</p>
              <p className="text-xs text-muted-foreground">
                Applied {format(new Date(member.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          {/* ── Personal Information ── */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Personal Information
            </p>
            <div className="space-y-1.5">
              {member.User.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Email</span>
                  <span className="font-medium truncate">{member.User.email}</span>
                </div>
              )}
              {member.User.dob && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Date of Birth</span>
                  <span className="font-medium">{format(new Date(member.User.dob), "MMM d, yyyy")}</span>
                </div>
              )}
              {member.User.gender && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Gender</span>
                  <span className="font-medium capitalize">{member.User.gender.toLowerCase()}</span>
                </div>
              )}
              {member.User.civilStatus && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Civil Status</span>
                  <span className="font-medium">{formatCivilStatus(member.User.civilStatus)}</span>
                </div>
              )}
              {member.User.bloodType && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Blood Type</span>
                  <span className="font-medium">{formatBloodType(member.User.bloodType)}</span>
                </div>
              )}
              {member.User.nationality && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Nationality</span>
                  <span className="font-medium">{member.User.nationality}</span>
                </div>
              )}
              {member.User.placeOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Place of Birth</span>
                  <span className="font-medium">{member.User.placeOfBirth}</span>
                </div>
              )}
              {(member.User.mobile || member.User.telephone) && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground min-w-[90px]">Contact</span>
                  <span className="font-medium">{member.User.mobile ?? member.User.telephone}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ── Addresses ── */}
          {addresses.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Addresses
              </p>
              <div className="space-y-2">
                {addresses.map((addr, idx) => {
                  const parts = [
                    addr.apartmentUnit,
                    addr.bldgName,
                    addr.addressLine,
                    addr.street,
                    addr.subdivision,
                    addr.barangay,
                    addr.city,
                    addr.state,
                    addr.zipCode,
                    addr.country,
                  ].filter(Boolean);
                  const formatted = parts.length > 0 ? parts.join(", ") : addr.address;
                  return (
                    <div
                      key={addr.id ?? idx}
                      className="rounded-lg border p-3 space-y-0.5"
                    >
                      {addr.isPrimary && (
                        <span className="text-xs font-medium text-primary">Primary</span>
                      )}
                      <p className="text-sm">{formatted}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Emergency Contacts ── */}
          {emergencyContacts.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                Emergency Contacts
              </p>
              <div className="space-y-2">
                {emergencyContacts.map((ec, idx) => {
                  const contactName = [ec.firstName, ec.lastName, ec.suffix]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div
                      key={ec.id ?? idx}
                      className="rounded-lg border p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{contactName}</p>
                        {ec.isPrimary && (
                          <span className="text-xs font-medium text-primary">Primary</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{ec.relationship}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{ec.phone}</span>
                      </div>
                      {ec.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                          <span>{ec.address}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Role description ── */}
          {member.OrganizationRole.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Role Description</p>
              <p className="text-sm text-muted-foreground">{member.OrganizationRole.description}</p>
            </div>
          )}

          {/* ── Requirements checklist ── */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Joining Requirements
            </p>
            {requirements.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">No requirements for this role.</p>
              </div>
            ) : (
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
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Optional</Badge>
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${fulfilled ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
                          {fulfilled ? "Submitted" : "Not yet submitted"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Student record details ── */}
          {studentRecord && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Student Record
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {studentRecord.studentId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Student ID</span>
                    <span className="font-medium">{studentRecord.studentId}</span>
                  </div>
                )}
                {studentRecord.lrn && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">LRN</span>
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
                    <span className="text-muted-foreground">Year Level</span>
                    <span className="font-medium">{studentRecord.OrganizationYearLevel.name}</span>
                  </div>
                )}
                {studentRecord.Program && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Program</span>
                    <span className="font-medium">{studentRecord.Program.name}</span>
                  </div>
                )}
                {studentRecord.Department && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{studentRecord.Department.name}</span>
                  </div>
                )}
                {studentRecord.College && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">College</span>
                    <span className="font-medium">{studentRecord.College.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Employment record details ── */}
          {employment && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Employment Record
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-1.5">
                {employment.employeeId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Employee ID</span>
                    <span className="font-medium">{employment.employeeId}</span>
                  </div>
                )}
                {employment.position && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium">{employment.position}</span>
                  </div>
                )}
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

          {/* ── Uploaded requirement files ── */}
          {requirementFiles.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Uploaded Requirement Files
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {requirementFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-md border p-2.5">
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
                    <button
                      type="button"
                      onClick={() => setPreviewFile({
                        url: f.File.url,
                        name: f.File.name,
                        mimeType: f.File.mimeType,
                      })}
                      className="text-primary hover:underline text-xs flex-shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Terms & Privacy Policy Acceptance ── */}
          <div className="rounded-lg border p-4 space-y-2.5">
            <p className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Terms &amp; Privacy Policy
            </p>
            <p className="text-xs text-muted-foreground">
              By submitting this application, the member has agreed to the organization&apos;s
              Terms &amp; Conditions and Privacy Policy.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={member.Organization.termsAndConditionsUrl ?? "/terms"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Terms &amp; Conditions
              </Link>
              <Link
                href={member.Organization.privacyPolicyUrl ?? "/privacy"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* ── Approval details (ACTIVE members) ── */}
          {status === "ACTIVE" && member.AcceptedBy && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20 p-4 space-y-1">
              <p className="text-sm font-medium flex items-center gap-2 text-green-800 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                Approved
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Approved by{" "}
                <span className="font-medium">
                  {getFullName(member.AcceptedBy.firstName, member.AcceptedBy.lastName)}
                </span>
                {member.acceptedAt && (
                  <> on {format(new Date(member.acceptedAt), "MMM d, yyyy")}</>
                )}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>

    {/* ── File Preview Dialog ── */}
    <Dialog open={previewFile !== null} onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle className="text-sm truncate">{previewFile?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center overflow-auto min-h-[200px]">
          {previewFile?.mimeType?.startsWith("image/") ? (
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          ) : previewFile?.mimeType === "application/pdf" ? (
            <iframe
              src={previewFile.url}
              className="w-full h-[70vh] rounded border"
              title={previewFile.name}
            />
          ) : (
            <div className="text-center py-8 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
              <Link
                href={previewFile?.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open file
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Admin Student Record Sub-form                              */
/* ─────────────────────────────────────────────────────────── */

interface AdminStudentRecordSubformProps {
  orgUid: string;
  onValidChange: (data: AdminStudentRecordValues | null) => void;
}

function AdminStudentRecordSubform({ orgUid, onValidChange }: AdminStudentRecordSubformProps) {
  const { data: studentLevels } = useStudentLevels();
  const { data: orgYearLevels } = useOrgYearLevels(orgUid);
  const { data: orgPrograms } = useOrgPrograms(orgUid);
  const { data: orgColleges } = useOrgColleges(orgUid);
  const { data: orgDepartments } = useOrgDepartments(orgUid);

  const form = useForm<AdminStudentRecordValues>({
    resolver: zodResolver(adminStudentRecordSchema),
    mode: "onChange",
    defaultValues: { studentId: "", lrn: "", isCollege: false },
  });

  const { watch, formState } = form;
  const isCollege = watch("isCollege");
  const [studentId, lrn, levelId, yearLevelId, programId, collegeId, departmentId] =
    watch(["studentId", "lrn", "levelId", "yearLevelId", "programId", "collegeId", "departmentId"]);

  useEffect(() => {
    if (formState.isValid) {
      onValidChange(form.getValues());
    } else {
      onValidChange(null);
    }
  }, [formState.isValid, studentId, lrn, levelId, yearLevelId, programId, isCollege, collegeId, departmentId, onValidChange, form]);

  return (
    <Form {...form}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Student ID *</FormLabel>
                <FormControl>
                  <input
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="e.g. 2024-00001"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lrn"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">LRN (optional)</FormLabel>
                <FormControl>
                  <input
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Learner Ref. No."
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="levelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Student Level *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(studentLevels ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearLevelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Year / Grade *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select year/grade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(orgYearLevels ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="programId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Program / Strand *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(orgPrograms ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isCollege"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-xs font-normal cursor-pointer">
                College student
              </FormLabel>
            </FormItem>
          )}
        />
        {isCollege && (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="collegeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">College</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(orgColleges ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select dept." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(orgDepartments ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Admin Employee Record Sub-form                             */
/* ─────────────────────────────────────────────────────────── */

interface AdminEmployeeRecordSubformProps {
  orgUid: string;
  onValidChange: (data: AdminEmployeeRecordValues | null) => void;
}

function AdminEmployeeRecordSubform({ orgUid, onValidChange }: AdminEmployeeRecordSubformProps) {
  const { data: orgOffices } = useOrgOffices(orgUid);
  const { data: orgDepartments } = useOrgDepartments(orgUid);
  const { data: orgColleges } = useOrgColleges(orgUid);

  const form = useForm<AdminEmployeeRecordValues>({
    resolver: zodResolver(adminEmployeeRecordSchema),
    mode: "onChange",
    defaultValues: { employeeId: "", position: "", designation: "", isCollege: false },
  });

  const { watch, formState } = form;
  const isCollege = watch("isCollege");
  const [employeeId, position, designation, officeId, departmentId, collegeId] =
    watch(["employeeId", "position", "designation", "officeId", "departmentId", "collegeId"]);

  useEffect(() => {
    if (formState.isValid) {
      onValidChange(form.getValues());
    } else {
      onValidChange(null);
    }
  }, [formState.isValid, employeeId, position, designation, officeId, departmentId, isCollege, collegeId, onValidChange, form]);

  return (
    <Form {...form}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Employee ID *</FormLabel>
                <FormControl>
                  <input
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="e.g. EMP-001"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Position *</FormLabel>
                <FormControl>
                  <input
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="e.g. Nurse"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Designation (optional)</FormLabel>
              <FormControl>
                <input
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Head Nurse"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="officeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Office *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(orgOffices ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Department (optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select dept." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(orgDepartments ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isCollege"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-xs font-normal cursor-pointer">
                Works in a college / university
              </FormLabel>
            </FormItem>
          )}
        />
        {isCollege && (
          <FormField
            control={form.control}
            name="collegeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">College</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(orgColleges ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}
      </div>
    </Form>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Admin File Upload Sub-form                                  */
/* ─────────────────────────────────────────────────────────── */

interface AdminFileUploadSubformProps {
  requirementType: string;
  orgUid: string;
  targetUserId: string;
  onValidChange: (file: StagedRequirementFile | null) => void;
}

function AdminFileUploadSubform({ requirementType, orgUid, targetUserId, onValidChange }: AdminFileUploadSubformProps) {
  const [stagedFile, setStagedFile] = useState<StagedRequirementFile | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 25) {
      toast.error("File size must not exceed 25 MB");
      return;
    }

    startUploadTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requirementType", requirementType);
      fd.append("orgUid", orgUid);
      fd.append("targetUserId", targetUserId);
      const result = await stageRequirementFileUploadAction(fd);
      if (result.status && result.data) {
        setStagedFile(result.data);
        onValidChange(result.data);
      } else {
        toast.error(result.message ?? "Upload failed. Please try again.");
      }
    });
  };

  const handleRemove = () => {
    setStagedFile(null);
    onValidChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (stagedFile) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20 p-2.5">
        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{stagedFile.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {(stagedFile.fileSize / 1024).toFixed(1)} KB
          </p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      className={`flex items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 cursor-pointer transition-colors text-sm ${
        isUploading
          ? "border-primary/40 bg-primary/5 cursor-not-allowed"
          : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
      }`}
    >
      <input
        ref={inputRef}
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
        {isUploading ? "Uploading…" : "Click to upload file"}
      </span>
    </label>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Add Member Sheet                                            */
/* ─────────────────────────────────────────────────────────── */

interface AddMemberSheetProps {
  open: boolean;
  orgUid: string;
  roles: OrgRole[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddMemberSheet({ open, orgUid, roles, onClose, onSuccess }: AddMemberSheetProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [studentRecordData, setStudentRecordData] = useState<AdminStudentRecordValues | null>(null);
  const [employeeRecordData, setEmployeeRecordData] = useState<AdminEmployeeRecordValues | null>(null);
  const [fileRequirementData, setFileRequirementData] = useState<Record<string, StagedRequirementFile | null>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const requirements: string[] = selectedRole?.requirements ?? [];

  const requirementsFulfilled = requirements.every((req) => {
    if (req === REQUIREMENT_STUDENT_RECORD) return studentRecordData !== null;
    if (req === REQUIREMENT_EMPLOYEE_RECORD) return employeeRecordData !== null;
    if (isFileUploadRequirement(req)) return fileRequirementData[req] != null;
    return true;
  });

  const resetState = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRoleId(null);
    setShowDropdown(false);
    setStudentRecordData(null);
    setEmployeeRecordData(null);
    setFileRequirementData({});
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelectedUser(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchUsersForOrgAction(orgUid, value.trim());
      setIsSearching(false);
      if (result.status && result.data) {
        setSearchResults(result.data);
        setShowDropdown(true);
      }
    }, 300);
  }, [orgUid]);

  const handleSelectUser = (user: UserResult) => {
    setSelectedUser(user);
    setQuery(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email);
    setShowDropdown(false);
    setStudentRecordData(null);
    setEmployeeRecordData(null);
    setFileRequirementData({});
  };

  const handleAdd = async () => {
    if (!selectedUser) { toast.error("Please select a user."); return; }
    if (!selectedRoleId) { toast.error("Please select a role."); return; }
    if (!requirementsFulfilled) { toast.error("Please fill in all required information."); return; }
    setIsAdding(true);
    try {
      if (requirements.includes(REQUIREMENT_STUDENT_RECORD) && studentRecordData) {
        const res = await upsertStudentRecordAction({ ...studentRecordData, orgUid, userId: selectedUser.userId });
        if (!res.status) { toast.error(res.message ?? "Failed to save student record."); return; }
      }
      if (requirements.includes(REQUIREMENT_EMPLOYEE_RECORD) && employeeRecordData) {
        const res = await upsertEmploymentRecordAction({ ...employeeRecordData, orgUid, userId: selectedUser.userId });
        if (!res.status) { toast.error(res.message ?? "Failed to save employee record."); return; }
      }
      const result = await joinOrganizationAction({
        userId: selectedUser.userId,
        orgUid,
        orgRoleId: selectedRoleId,
      });
      if (result.status) {
        // Link any staged requirement files to the new org member
        const stagedFiles = Object.values(fileRequirementData).filter(
          (f): f is StagedRequirementFile => f !== null
        );
        if (result.data?.id && stagedFiles.length > 0) {
          await linkRequirementFilesAction({
            orgMemberId: result.data.id,
            files: stagedFiles,
          });
        }
        toast.success("Member added successfully.");
        resetState();
        onSuccess();
        onClose();
      } else {
        toast.error(result.message ?? "Failed to add member.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Member
          </SheetTitle>
          <SheetDescription>
            Search for a user and select their role in the organization.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Name or email…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="rounded-md border bg-background shadow-md overflow-hidden">
                {searchResults.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                    onMouseDown={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={user.picture ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getFullName(user.firstName, user.lastName)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground px-1">No users found.</p>
            )}
          </div>

          {/* Role selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select
              value={selectedRoleId?.toString() ?? ""}
              onValueChange={(v) => {
                setSelectedRoleId(Number(v));
                setStudentRecordData(null);
                setEmployeeRecordData(null);
                setFileRequirementData({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role requirements */}
          {selectedRole && selectedUser && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-primary" />
                Requirements for <span className="text-primary">{selectedRole.name}</span>
              </div>
              {requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No additional requirements for this role.
                </p>
              ) : (
                <div className="space-y-5">
                  {requirements.includes(REQUIREMENT_STUDENT_RECORD) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Student Record
                        {studentRecordData
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-auto" />
                          : <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-auto" />
                        }
                      </div>
                      <AdminStudentRecordSubform
                        key={`student-${selectedUser.userId}-${selectedRoleId}`}
                        orgUid={orgUid}
                        onValidChange={setStudentRecordData}
                      />
                    </div>
                  )}
                  {requirements.includes(REQUIREMENT_EMPLOYEE_RECORD) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        Employee Record
                        {employeeRecordData
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-auto" />
                          : <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-auto" />
                        }
                      </div>
                      <AdminEmployeeRecordSubform
                        key={`employee-${selectedUser.userId}-${selectedRoleId}`}
                        orgUid={orgUid}
                        onValidChange={setEmployeeRecordData}
                      />
                    </div>
                  )}
                  {requirements
                    .filter((r) => r !== REQUIREMENT_STUDENT_RECORD && r !== REQUIREMENT_EMPLOYEE_RECORD)
                    .map((req) => {
                      if (isFileUploadRequirement(req)) {
                        const staged = fileRequirementData[req] ?? null;
                        return (
                          <div key={req} className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                              {formatRequirementLabel(req)}
                              {staged
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 ml-auto" />
                                : <AlertCircle className="h-3.5 w-3.5 text-amber-500 ml-auto" />
                              }
                            </div>
                            <AdminFileUploadSubform
                              key={`file-${req}-${selectedUser.userId}-${selectedRoleId}`}
                              requirementType={req}
                              orgUid={orgUid}
                              targetUserId={selectedUser.userId}
                              onValidChange={(f) =>
                                setFileRequirementData((prev) => ({ ...prev, [req]: f }))
                              }
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={req} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="capitalize">{req.replaceAll("_", " ")}</span>
                        </div>
                      );
                    })}
                </div>
              )}
              {selectedRole.description && (
                <p className="text-xs text-muted-foreground border-t pt-3 mt-2">
                  {selectedRole.description}
                </p>
              )}
            </div>
          )}
          {selectedRole && !selectedUser && requirements.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4 text-primary" />
                Requirements for <span className="text-primary">{selectedRole.name}</span>
              </div>
              <ul className="space-y-1">
                {requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="capitalize">{req.replaceAll("_", " ")}</span>
                  </li>
                ))}
              </ul>
              {selectedRole.description && (
                <p className="text-xs text-muted-foreground border-t pt-3 mt-2">
                  {selectedRole.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isAdding}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleAdd}
              disabled={isAdding || !selectedUser || !selectedRoleId || !requirementsFulfilled}
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Add Member
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Change Role Sheet                                           */
/* ─────────────────────────────────────────────────────────── */

interface ChangeRoleSheetProps {
  member: OrgMember | null;
  roles: OrgRole[];
  onClose: () => void;
  onSuccess: (memberId: number, newRole: OrgRole) => void;
}

function ChangeRoleSheet({ member, roles, onClose, onSuccess }: ChangeRoleSheetProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClose = () => {
    setSelectedRoleId(null);
    onClose();
  };

  const handleUpdate = async () => {
    if (!member || !selectedRoleId) { toast.error("Please select a role."); return; }
    setIsUpdating(true);
    const result = await updateOrgMemberRoleAction(member.id, selectedRoleId);
    setIsUpdating(false);
    if (result.status) {
      const newRole = roles.find((r) => r.id === selectedRoleId);
      if (newRole) onSuccess(member.id, newRole);
      toast.success("Member role updated.");
      handleClose();
    } else {
      toast.error(result.message ?? "Failed to update role.");
    }
  };

  if (!member) return null;
  const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Change Role
          </SheetTitle>
          <SheetDescription>
            Update the role for <span className="font-medium text-foreground">{fullName}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={member.User.picture ?? undefined} alt={fullName} />
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(member.User.firstName, member.User.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">
                Current role: <span className="font-medium">{member.OrganizationRole.name}</span>
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select
              value={selectedRoleId?.toString() ?? ""}
              onValueChange={(v) => setSelectedRoleId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((r) => r.id !== member.OrganizationRole.id)
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoleId && (() => {
            const newRole = roles.find((r) => r.id === selectedRoleId);
            if (!newRole) return null;
            const reqs: string[] = newRole.requirements ?? [];
            return (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Requirements for <span className="text-primary">{newRole.name}</span>
                </p>
                {reqs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No additional requirements.</p>
                ) : (
                  <ul className="space-y-1">
                    {reqs.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span className="capitalize">{req.replaceAll("_", " ")}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {newRole.description && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    {newRole.description}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        <div className="p-6 border-t">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={handleUpdate}
              disabled={isUpdating || !selectedRoleId}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
              Update Role
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Restore Default Permissions Dialog (Org)                   */
/* ─────────────────────────────────────────────────────────── */

interface RestoreOrgDefaultPermissionsDialogProps {
  member: OrgMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

function RestoreOrgDefaultPermissionsDialog({ member, onClose, onSuccess }: RestoreOrgDefaultPermissionsDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!member) return;
    startTransition(async () => {
      const result = await resetOrgMemberPermissionsAction(member.id);
      if (result.status) {
        toast.success(result.message ?? "Permissions restored to defaults.");
        onSuccess();
        onClose();
      } else {
        toast.error(result.message ?? "Failed to restore permissions.");
      }
    });
  };

  if (!member) return null;
  const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);

  return (
    <Dialog open={!!member} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Restore Default Permissions
          </DialogTitle>
          <DialogDescription>
            This will reset all permissions for{" "}
            <span className="font-medium text-foreground">{fullName}</span>{" "}
            back to the default permissions of their current role (
            <span className="font-medium text-foreground">{member.OrganizationRole.name}</span>
            ).
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Warning
          </p>
          <p>
            Any custom permission changes made to this member will be permanently lost and replaced with the role&apos;s default permissions. This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Restore Defaults
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Component                                             */
/* ─────────────────────────────────────────────────────────── */

export function OrgMembersClient({
  orgUid,
  initialMembers,
  initialTotal,
  initialNextCursor,
  initialHasMore,
  roles,
  pageSize = 20,
}: OrgMembersClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ── Filter state (synced to URL) ────────────────────────────────────
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<OrganizationMemberStatus | "ALL">(
    () => (searchParams.get("status") as OrganizationMemberStatus | "ALL") ?? "ALL"
  );
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get("role") ?? "ALL");

  // ── Cursor / list state ─────────────────────────────────────────────
  const [members, setMembers] = useState<OrgMember[]>(initialMembers);
  const [total, setTotal] = useState(initialTotal);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // ── Loading flags ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, startLoadMoreTransition] = useTransition();
  const [actioningId, setActioningId] = useState<number | null>(null);

  // ── Sheet state ─────────────────────────────────────────────────────
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [applicationMember, setApplicationMember] = useState<OrgMember | null>(null);
  const [changeRoleMember, setChangeRoleMember] = useState<OrgMember | null>(null);
  const [restorePermissionsMember, setRestorePermissionsMember] = useState<OrgMember | null>(null);

  // ── Refs for scroll-based load more (always current values) ────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const nextCursorRef = useRef(nextCursor);
  const searchRef = useRef(search);
  const statusRef = useRef(statusFilter);
  const roleRef = useRef(roleFilter);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  useEffect(() => { nextCursorRef.current = nextCursor; }, [nextCursor]);
  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { statusRef.current = statusFilter; }, [statusFilter]);
  useEffect(() => { roleRef.current = roleFilter; }, [roleFilter]);

  // ── URL sync: persist filters only (skip first mount) ─────────────
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) { isFirstSync.current = false; return; }
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, statusFilter, roleFilter, pathname, router]);

  // ── Full reload when filters change ────────────────────────────────
  const fetchFresh = useCallback(
    async (searchQuery: string, status: OrganizationMemberStatus | "ALL", role: string) => {
      setIsLoading(true);
      try {
        const result = await getOrgMembersAction({
          orgUid,
          pageSize,
          searchKey: searchQuery || undefined,
          status: status !== "ALL" ? [status] : undefined,
          role: role !== "ALL" ? [role] : undefined,
        });
        if (result.status && result.data) {
          setMembers(result.data.data);
          setTotal(result.data.total);
          setNextCursor(result.data.nextCursor);
          setHasMore(result.data.hasMore);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [orgUid, pageSize]
  );

  // ── Load more (cursor-based, uses refs to avoid stale closures) ─────
  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || !nextCursorRef.current) return;
    startLoadMoreTransition(async () => {
      const result = await getOrgMembersAction({
        orgUid,
        pageSize,
        cursor: nextCursorRef.current ?? undefined,
        searchKey: searchRef.current || undefined,
        status: statusRef.current !== "ALL" ? [statusRef.current] : undefined,
        role: roleRef.current !== "ALL" ? [roleRef.current] : undefined,
      });
      if (result.status && result.data) {
        setMembers((prev) => [...prev, ...result.data!.data]);
        setNextCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore);
        setTotal(result.data.total);
      }
    });
  }, [orgUid, pageSize]);

  // ── IntersectionObserver for infinite scroll ───────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const scrollRoot = sentinel.closest<HTMLElement>("[data-scroll-root]");
    if (!scrollRoot) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollRoot;
      if (
        scrollHeight - scrollTop - clientHeight < 300 &&
        hasMoreRef.current &&
        !isLoadingMoreRef.current
      ) {
        loadMore();
      }
    };

    scrollRoot.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => scrollRoot.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  // ── Filter handlers ─────────────────────────────────────────────────
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    fetchFresh(value, statusFilter, roleFilter);
  }, [fetchFresh, statusFilter, roleFilter]);

  const handleStatusChange = useCallback((value: string) => {
    const s = value as OrganizationMemberStatus | "ALL";
    setStatusFilter(s);
    fetchFresh(search, s, roleFilter);
  }, [fetchFresh, search, roleFilter]);

  const handleRoleChange = useCallback((value: string) => {
    setRoleFilter(value);
    fetchFresh(search, statusFilter, value);
  }, [fetchFresh, search, statusFilter]);

  // ── Member actions ──────────────────────────────────────────────────
  const handleStatusUpdate = useCallback(
    async (memberId: number, status: OrganizationMemberStatus) => {
      setActioningId(memberId);
      const result = await setMembershipRequestStatusAction(memberId, status);
      setActioningId(null);
      if (result.status) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status } : m)));
        toast.success(`Member status updated to ${status.toLowerCase()}.`);
      } else {
        toast.error(result.message ?? "Failed to update status.");
      }
    },
    []
  );

  const handleRemove = useCallback(async (memberId: number) => {
    setActioningId(memberId);
    const result = await deleteMembershipAction(memberId);
    setActioningId(null);
    if (result.status) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setTotal((prev) => prev - 1);
      toast.success("Member removed.");
    } else {
      toast.error(result.message ?? "Failed to remove member.");
    }
  }, []);

  const handleAddSuccess = useCallback(() => {
    fetchFresh(search, statusFilter, roleFilter);
  }, [fetchFresh, search, statusFilter, roleFilter]);

  const handleChangeRoleSuccess = useCallback((memberId: number, newRole: OrgRole) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, OrganizationRole: newRole } : m
      )
    );
  }, []);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-0 pb-10">
      {/* ── Sticky filter bar ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Role filter */}
          <Select value={roleFilter} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add member */}
          <Button
            className="gap-1.5 flex-shrink-0"
            onClick={() => setAddSheetOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Counter */}
        <p className="text-xs text-muted-foreground mt-2">
          Showing {members.length} of {total} member{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Member list ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-3 space-y-2">
        {/* Full reload spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No members found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Members */}
        {!isLoading &&
          members.map((member) => {
            const status = member.status as OrganizationMemberStatus;
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE.INACTIVE;
            const fullName = getFullName(member.User.firstName, member.User.lastName, member.User.suffix);
            const initials = getInitials(member.User.firstName, member.User.lastName);
            const studentRecord = member.User.StudentRecords?.[0];
            const employment = member.User.UserEmployments?.[0];
            const isActioning = actioningId === member.id;

            return (
              <Card
                key={member.id}
                className="border transition-colors hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={member.User.picture ?? undefined} alt={fullName} />
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm truncate">{fullName}</span>
                        <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{member.OrganizationRole.name}</span>
                        {studentRecord && (
                          <span className="text-xs text-muted-foreground">ID: {studentRecord.studentId}</span>
                        )}
                        {employment && (
                          <span className="text-xs text-muted-foreground">
                            {employment.position ?? employment.designation ?? "Employee"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isActioning}
                        >
                          {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Member actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          {fullName}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {status === "PENDING" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setApplicationMember(member)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Application
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "INACTIVE")}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {status === "ACTIVE" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setApplicationMember(member)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "SUSPENDED")}
                              className="gap-2"
                            >
                              <Pause className="h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "INACTIVE")}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <PowerOff className="h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </>
                        )}
                        {status === "SUSPENDED" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setApplicationMember(member)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <Play className="h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          </>
                        )}
                        {status === "INACTIVE" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setApplicationMember(member)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "ACTIVE")}
                              className="gap-2 text-green-600 focus:text-green-600"
                            >
                              <Play className="h-4 w-4" />
                              Re-activate
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setChangeRoleMember(member)}
                          className="gap-2"
                        >
                          <UserCog className="h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setRestorePermissionsMember(member)}
                          className="gap-2"
                        >
                          <ShieldX className="h-4 w-4" />
                          Restore Default Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemove(member.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {/* Sentinel + loading more indicator */}
        <div ref={sentinelRef} className="h-4" />
        {isLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more members…
          </div>
        )}
        {!isLoadingMore && !hasMore && members.length > 0 && !isLoading && (
          <p className="text-center text-xs text-muted-foreground py-4">
            All {total} member{total !== 1 ? "s" : ""} loaded
          </p>
        )}
      </div>

      {/* ── Add Member Sheet ─────────────────────────────────── */}
      <AddMemberSheet
        open={addSheetOpen}
        orgUid={orgUid}
        roles={roles}
        onClose={() => setAddSheetOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ── Member Application Sheet ─────────────────────────── */}
      <MemberApplicationSheet
        member={applicationMember}
        onClose={() => setApplicationMember(null)}
      />

      {/* ── Change Role Sheet ─────────────────────────────────── */}
      <ChangeRoleSheet
        member={changeRoleMember}
        roles={roles}
        onClose={() => setChangeRoleMember(null)}
        onSuccess={handleChangeRoleSuccess}
      />

      {/* ── Restore Default Permissions Dialog ───────────────── */}
      <RestoreOrgDefaultPermissionsDialog
        member={restorePermissionsMember}
        onClose={() => setRestorePermissionsMember(null)}
        onSuccess={() => {}}
      />
    </div>
  );
}
