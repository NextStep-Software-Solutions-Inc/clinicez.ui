'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  ClipboardList,
  Mail,
  Calendar,
  Info,
  Phone,
  MapPin,
  HeartPulse,
  GraduationCap,
  Briefcase,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Pencil,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AdminFileUploadSubform } from './OrgMembersClient' // Import subform component

import {
  deleteOrgMemberRequirementFileAction,
  linkRequirementFilesAction,
} from '@/actions/organizations/org-member-requirement-file.action'
import { type GetOrgMembers } from '@/actions/organizations/org-member.action'
import { StudentRecordInlineForm } from './forms/StudentRecordInlineForm'
import { EmployeeRecordInlineForm } from './forms/EmployeeRecordInlineForm'

import {
  isFileUploadRequirement,
  parseRequirementSettings,
  isRequirementRequired,
  REQUIREMENT_STUDENT_RECORD,
  REQUIREMENT_EMPLOYEE_RECORD,
  formatRequirementLabel,
  type StagedRequirementFile,
} from '@/lib/requirement-types'
import { type OrganizationMemberStatus } from '@/types'
import { toast } from 'sonner'

export type OrgMember = NonNullable<NonNullable<GetOrgMembers['data']>['data']>[number]

export interface MemberApplicationSheetProps {
  member: OrgMember | null
  orgUid: string
  onClose: () => void
  onFilesChanged?: (memberId: number) => void
  onStatusUpdate?: (memberId: number, status: OrganizationMemberStatus) => Promise<void>
}

function getInitials(firstName: string | null, lastName: string | null): string {
  return ((firstName?.charAt(0) ?? '') + (lastName?.charAt(0) ?? '')).toUpperCase() || '?'
}

function getFullName(firstName: string | null, lastName: string | null, suffix?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean).join(' ')
  return suffix ? `${parts} ${suffix}` : parts || 'Unknown User'
}

function formatBloodType(bt: string): string {
  return bt.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('RH', 'Rh')
}

function formatCivilStatus(cs: string): string {
  return cs.charAt(0) + cs.slice(1).toLowerCase()
}

export function MemberApplicationSheet({
  member,
  orgUid,
  onClose,
  onFilesChanged,
  onStatusUpdate,
}: MemberApplicationSheetProps) {
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
    mimeType: string | null
  } | null>(null)
  const [editingReq, setEditingReq] = useState<string | null>(null)
  const [localFiles, setLocalFiles] = useState<OrgMember['OrgMemberRequirementFiles']>([])
  const [isDeletingFileId, setIsDeletingFileId] = useState<number | null>(null)
  const [, startTransition] = useTransition()
  const tempIdCounter = useRef(-1)

  // Local copy of member to dynamically update values after save
  const [localMember, setLocalMember] = useState<OrgMember | null>(null)

  // Editing state variables
  const [isEditingStudent, setIsEditingStudent] = useState(false)
  const [isEditingEmployee, setIsEditingEmployee] = useState(false)
  const [isActioning, setIsActioning] = useState(false)

  // Sync state whenever the member prop changes
  useEffect(() => {
    setLocalMember(member)
    setLocalFiles(member?.OrgMemberRequirementFiles ?? [])
    setIsEditingStudent(false)
    setIsEditingEmployee(false)
  }, [member])

  if (!localMember) return null

  const requirements: string[] = localMember.OrganizationRole.requirements ?? []
  const requirementSettings = parseRequirementSettings(localMember.OrganizationRole.requirementSettings)

  const studentRecord = localMember.User.StudentRecords?.[0]
  const employment = localMember.User.UserEmployments?.[0]
  const addresses = localMember.User.UserAddresses ?? []
  const emergencyContacts = localMember.User.UserEmergencyContacts ?? []
  const fullName = getFullName(localMember.User.firstName, localMember.User.lastName, localMember.User.suffix)
  const initials = getInitials(localMember.User.firstName, localMember.User.lastName)
  const status = localMember.status as OrganizationMemberStatus
  const isPending = status === 'PENDING'

  const requirementFiles = localFiles

  function isFulfilled(req: string): boolean {
    if (req === REQUIREMENT_STUDENT_RECORD) return studentRecord !== undefined
    if (req === REQUIREMENT_EMPLOYEE_RECORD) return employment !== undefined
    if (isFileUploadRequirement(req)) {
      return requirementFiles.some((f) => f.requirementType === req)
    }
    return false
  }

  function handleFileAdded(staged: StagedRequirementFile) {
    const tempId = --tempIdCounter.current
    const optimisticFile: OrgMember['OrgMemberRequirementFiles'][number] = {
      id: tempId,
      requirementType: staged.requirementType,
      createdAt: new Date(),
      File: {
        id: staged.fileId,
        name: staged.fileName,
        size: staged.fileSize,
        url: '',
        mimeType: null,
        createdAt: new Date(),
        FileType: { name: '' },
      },
    }
    setLocalFiles((prev) => [...prev, optimisticFile])
    setEditingReq(null)
    onFilesChanged?.(localMember!.id)
  }

  function handleFileDeleted(recordId: number) {
    setIsDeletingFileId(recordId)
    startTransition(async () => {
      try {
        const result = await deleteOrgMemberRequirementFileAction(recordId)
        if (result.status) {
          setLocalFiles((prev) => prev.filter((f) => f.id !== recordId))
          toast.success('Requirement file removed.')
          onFilesChanged?.(localMember!.id)
        } else {
          toast.error(result.message ?? 'Failed to remove file.')
        }
      } catch (err) {
        console.error('[OrgMembers] Delete file error:', err)
        toast.error('Failed to remove file. Please try again.')
      }
      setIsDeletingFileId(null)
    })
  }

  // Handlers for starting edit states
  const startEditStudent = () => {
    setIsEditingStudent(true)
  }

  const startEditEmployee = () => {
    setIsEditingEmployee(true)
  }

  const handleApprove = async () => {
    setIsActioning(true)
    try {
      await onStatusUpdate?.(localMember.id, 'ACTIVE')
      onClose()
    } catch (e) {
      toast.error('Failed to approve application')
    } finally {
      setIsActioning(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this application?')) return
    setIsActioning(true)
    try {
      await onStatusUpdate?.(localMember.id, 'INACTIVE')
      onClose()
    } catch (e) {
      toast.error('Failed to reject application')
    } finally {
      setIsActioning(false)
    }
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
                <AvatarImage src={localMember.User.picture ?? undefined} alt={fullName} />
                <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{fullName}</p>
                <p className="text-sm text-muted-foreground">{localMember.OrganizationRole.name}</p>
                <p className="text-xs text-muted-foreground">
                  Applied {format(new Date(localMember.createdAt), 'MMM d, yyyy')}
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
                {localMember.User.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Email</span>
                    <span className="font-medium truncate">{localMember.User.email}</span>
                  </div>
                )}
                {localMember.User.dob && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Date of Birth</span>
                    <span className="font-medium">{format(new Date(localMember.User.dob), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {localMember.User.gender && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Gender</span>
                    <span className="font-medium capitalize">{localMember.User.gender.toLowerCase()}</span>
                  </div>
                )}
                {localMember.User.civilStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Civil Status</span>
                    <span className="font-medium">{formatCivilStatus(localMember.User.civilStatus)}</span>
                  </div>
                )}
                {localMember.User.bloodType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Blood Type</span>
                    <span className="font-medium">{formatBloodType(localMember.User.bloodType)}</span>
                  </div>
                )}
                {localMember.User.nationality && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Nationality</span>
                    <span className="font-medium">{localMember.User.nationality}</span>
                  </div>
                )}
                {localMember.User.placeOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Place of Birth</span>
                    <span className="font-medium">{localMember.User.placeOfBirth}</span>
                  </div>
                )}
                {(localMember.User.mobile || localMember.User.telephone) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground min-w-[90px]">Contact</span>
                    <span className="font-medium">{localMember.User.mobile ?? localMember.User.telephone}</span>
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
                    ].filter(Boolean)
                    const formatted = parts.length > 0 ? parts.join(', ') : addr.address
                    return (
                      <div key={addr.id ?? idx} className="rounded-lg border p-3 space-y-0.5">
                        {addr.isPrimary && <span className="text-xs font-medium text-primary">Primary</span>}
                        <p className="text-sm">{formatted}</p>
                      </div>
                    )
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
                    const contactName = [ec.firstName, ec.lastName, ec.suffix].filter(Boolean).join(' ')
                    return (
                      <div key={ec.id ?? idx} className="rounded-lg border p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{contactName}</p>
                          {ec.isPrimary && <span className="text-xs font-medium text-primary">Primary</span>}
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
                    )
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* ── Role description ── */}
            {localMember.OrganizationRole.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Role Description</p>
                <p className="text-sm text-muted-foreground">{localMember.OrganizationRole.description}</p>
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
                    const fulfilled = isFulfilled(req)
                    const optional = !isRequirementRequired(req, requirementSettings)
                    return (
                      <div
                        key={req}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          fulfilled
                            ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20'
                            : 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
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
                              fulfilled ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {fulfilled ? 'Submitted' : 'Not yet submitted'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Student record details / edit form ── */}
            {requirements.includes(REQUIREMENT_STUDENT_RECORD) && (
              <Card className="overflow-visible">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Student Record
                  </CardTitle>
                  {isPending && !isEditingStudent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary/80"
                      onClick={startEditStudent}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {studentRecord ? 'Edit' : 'Create'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {isEditingStudent ? (
                    <StudentRecordInlineForm
                      studentRecord={studentRecord}
                      orgUid={orgUid}
                      userId={localMember.User.userId}
                      onCancel={() => setIsEditingStudent(false)}
                      onSuccess={(updatedRecord) => {
                        setLocalMember((prev) => {
                          if (!prev) return null
                          return {
                            ...prev,
                            User: {
                              ...prev.User,
                              StudentRecords: [updatedRecord],
                            },
                          }
                        })
                        setIsEditingStudent(false)
                        onFilesChanged?.(localMember.id)
                      }}
                    />
                  ) : studentRecord ? (
                    <div className="space-y-1.5">
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
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">No student record created yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Employment record details / edit form ── */}
            {requirements.includes(REQUIREMENT_EMPLOYEE_RECORD) && (
              <Card className="overflow-visible">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Employment Record
                  </CardTitle>
                  {isPending && !isEditingEmployee && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary/80"
                      onClick={startEditEmployee}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {employment ? 'Edit' : 'Create'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {isEditingEmployee ? (
                    <EmployeeRecordInlineForm
                      employment={employment}
                      orgUid={orgUid}
                      userId={localMember.User.userId}
                      onCancel={() => setIsEditingEmployee(false)}
                      onSuccess={(updatedRecord) => {
                        setLocalMember((prev) => {
                          if (!prev) return null
                          return {
                            ...prev,
                            User: {
                              ...prev.User,
                              UserEmployments: [updatedRecord],
                            },
                          }
                        })
                        setIsEditingEmployee(false)
                        onFilesChanged?.(localMember.id)
                      }}
                    />
                  ) : employment ? (
                    <div className="space-y-1.5">
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
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">No employee record created yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Uploaded requirement files ── */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Requirement Files
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {requirementFiles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No files uploaded yet.</p>
                )}
                {requirementFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-md border p-2.5">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground capitalize">
                        {formatRequirementLabel(f.requirementType)}
                      </p>
                      <p className="text-sm font-medium truncate">{f.File.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(f.File.size / 1024).toFixed(1)} KB · {format(new Date(f.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
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
                        onClick={() => handleFileDeleted(f.id)}
                        disabled={isDeletingFileId === f.id}
                        className="ml-2 text-destructive hover:text-destructive/80 disabled:opacity-50"
                        title="Remove file"
                      >
                        {isDeletingFileId === f.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {/* ── Upload new file for a requirement ── */}
                {requirements.filter(isFileUploadRequirement).length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" />
                      Upload Requirement File
                    </p>
                    {editingReq === null ? (
                      <div className="flex flex-wrap gap-2">
                        {requirements.filter(isFileUploadRequirement).map((req) => (
                          <Button
                            key={req}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setEditingReq(req)}
                          >
                            <Pencil className="h-3 w-3" />
                            {formatRequirementLabel(req)}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{formatRequirementLabel(editingReq)}</p>
                          <button
                            type="button"
                            onClick={() => setEditingReq(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <AdminFileUploadSubform
                          requirementType={editingReq}
                          orgUid={orgUid}
                          targetUserId={localMember.User.userId}
                          onValidChange={(staged) => {
                            if (staged) {
                              startTransition(async () => {
                                try {
                                  const result = await linkRequirementFilesAction({
                                    orgMemberId: localMember.id,
                                    files: [staged],
                                  })
                                  if (result.status) {
                                    handleFileAdded(staged)
                                    toast.success('Requirement file uploaded.')
                                  } else {
                                    toast.error(result.message ?? 'Failed to link file.')
                                  }
                                } catch (err) {
                                  console.error('[OrgMembers] Link file error:', err)
                                  toast.error('Failed to link file. Please try again.')
                                }
                              })
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Terms & Privacy Policy Acceptance ── */}
            <div className="rounded-lg border p-4 space-y-2.5">
              <p className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Terms &amp; Privacy Policy
              </p>
              <p className="text-xs text-muted-foreground">
                By submitting this application, the member has agreed to the organization&apos;s Terms &amp; Conditions
                and Privacy Policy.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href={localMember.Organization.termsAndConditionsUrl ?? '/terms'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Terms &amp; Conditions
                </Link>
                <Link
                  href={localMember.Organization.privacyPolicyUrl ?? '/privacy'}
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
            {status === 'ACTIVE' && localMember.AcceptedBy && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20 p-4 space-y-1">
                <p className="text-sm font-medium flex items-center gap-2 text-green-800 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Approved by{' '}
                  <span className="font-medium">
                    {getFullName(localMember.AcceptedBy.firstName, localMember.AcceptedBy.lastName)}
                  </span>
                  {localMember.acceptedAt && <> on {format(new Date(localMember.acceptedAt), 'MMM d, yyyy')}</>}
                </p>
              </div>
            )}
          </div>

          {/* ── Sticky Action Buttons for Pending Applicants at the bottom ── */}
          {isPending && (
            <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3 z-10">
              <Button
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 h-10 font-bold"
                onClick={handleReject}
                disabled={isActioning}
              >
                Reject Application
              </Button>
              <Button
                className="flex-1 h-10 font-bold bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={isActioning || isEditingStudent || isEditingEmployee}
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Approve Application
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── File Preview Dialog ── */}
      <Dialog
        open={previewFile !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null)
        }}
      >
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle className="text-sm truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto min-h-[200px]">
            {previewFile?.mimeType?.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain rounded" />
            ) : previewFile?.mimeType === 'application/pdf' ? (
              <iframe src={previewFile.url} className="w-full h-[70vh] rounded border" title={previewFile.name} />
            ) : (
              <div className="text-center py-8 space-y-3">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                <Link
                  href={previewFile?.url ?? '#'}
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
  )
}
