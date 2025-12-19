"use client";

import dayjs, { combineDateTime } from "@lib/day-utils"

import { MoreVertical, Pencil } from "lucide-react"

import { Avatar, AvatarFallback } from "@components/ui/avatar"
import { Button } from "@components/ui/button"
import Link from "next/link";

import { Separator } from "@components/ui/separator"
import { ScrollArea } from "@components/ui/scroll-area"
import Image from "next/image"
import Each from "@components/utils/Each"
import { Badge } from "@components/ui/badge"
import ConsultationTicketSheet from "@components/appointment/ConsultationTicketSheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { useParams, useSearchParams } from "next/navigation"
import { useClinicAppointment } from "@hooks/useAppointment";
import { calculateAge } from "@/lib/utils";
import PageLoading from "@components/PageLoading";
import { revalidatePath } from "@actions/cache.action";
import { mutate } from "swr";
import { useAppointmentTools } from "./useAppointmentActions";
import { useUser } from "@clerk/nextjs";
import Attachments from "./Attachments";
import { getBadgeVariantFromLabel } from "@lib/utils";

import { LabelValue } from "@components/LabelValue";
import PreAssessmentNoteSheet from "./PreAssessmentNoteSheet";
import { Fragment, useRef } from "react";
import { GetAppointment } from "@actions/appointments/appointments.action";
import AppointmentRoutingHistorySheet from "./AppointmentRoutingHistorySheet";
import CompleteAppointment from "./CompleteAppointment";
import { PERMISSIONS } from "@lib/permissions";
import { usePermissions } from "@/hooks/usePermission";
import { useHPs } from "@/hooks/useHP";
import { getFullName, getDepartmentName, getProgramYear } from "@/lib/formatter-utils";
import { isAssignedNurseToAppointment } from "@/lib/nurse-utils";
import { getHealthcareProviderName } from "@/lib/hp-utils";
import TagHPsSheet from "./TagHPsSheet";


export default function AppointmentDisplay() {

  const { user } = useUser()
  const { clinicUid } = useParams<{ clinicUid: string }>()
  const searchParams = useSearchParams()
  const appointmentId = parseInt(searchParams.get("_appointment") ?? "")

  const { data: freshAppointment, isLoading: loadingAppointment } = useClinicAppointment({
    clinicUid: clinicUid,
    appointmentId: appointmentId
  })
  const { data: myClinicPermissions } = usePermissions({
    userId: user?.id ?? "",
    type: "CLINIC"
  })
  const { data: myHps } = useHPs({
    userId: user?.id ?? "",
  })

  const requesters = freshAppointment?.data?.Requesters
  const preferredHp = freshAppointment?.data?.AppointmentAttribute?.PreferredAppointee

  const revalidate = async () => {
    revalidatePath(`/clinic/${clinicUid}/appointments`, "page")
    mutate((key) => typeof key === 'string' && key.startsWith(`/api/clinics/${clinicUid}/appointments`), undefined, {
      revalidate: true
    })
  }
  const { tools: appointmentTools } = useAppointmentTools({
    appointment: freshAppointment?.data,
    revalidate
  })

  if (!appointmentId) {
    return <div className="p-8 text-center text-muted-foreground">No appointment selected</div>
  }

  if (loadingAppointment) {
    return <PageLoading label="Loading Appointment" />
  };

  if (!(freshAppointment && freshAppointment.data)) {
    return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>
  }

  const myClinicPermissionArray = myClinicPermissions?.map(p => p.name) ?? []

  // Check if the current user is an assigned nurse to this appointment
  const isAssignedNurse = isAssignedNurseToAppointment(freshAppointment.data, user?.id);

  // Check if user has write permission for pre-assessment notes
  const hasWritePermission = [PERMISSIONS.CLINIC["WRITE:CLINIC:PRE_ASSESSMENT_NOTE"].name].every(p => myClinicPermissionArray.includes(p));

  // Only assigned nurses can edit pre-assessment notes
  const canEditPreAssessmentNotes = hasWritePermission && isAssignedNurse;

  const preferredHPName = (() => {
    const title = preferredHp?.HPProfile?.title ?? "";
    const name = preferredHp?.HPProfile?.name ?? "";
    const suffix = preferredHp?.HPProfile?.suffix ?? "";
    const prof = `${title} ${name} ${suffix}`.replace(/\s+/g, " ").trim();
    if (prof) return prof;
    const firstName = preferredHp?.User?.firstName ?? "";
    const middleName = preferredHp?.User?.middleName ?? "";
    const lastName = preferredHp?.User?.lastName ?? "";
    const userSuffix = preferredHp?.User?.suffix ?? "";
    const user = `${firstName} ${middleName} ${lastName} ${userSuffix}`.replace(/\s+/g, " ").trim();
    return user || "No Healthcare Provider Selected";
  })()
  const meetingUrl = freshAppointment.data.AppointmentAttribute?.meetingUrl

  return (
    <div className="flex h-full flex-col">
      {/* Sticky Toolbar */}
      <div className="flex items-center p-2 sticky top-0 bg-background z-10">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="capitalize">{freshAppointment.data.AppointmentAttribute?.status}</Badge>

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Each
            key={freshAppointment.data.id}
            of={appointmentTools.filter((tool) => {
              const enable = tool.permissions.every(p => myClinicPermissionArray.includes(p))
                && tool.appointmentStatuses.includes(freshAppointment.data!.AppointmentAttribute?.status.toLocaleLowerCase() ?? "")
                && (
                  tool.routedAptStatuses.length === 0
                  || (
                    freshAppointment.data?.AppointmentAttribute?.status !== "ROUTED"
                    || freshAppointment.data?.AppointmentRouting.some(apt => tool.routedAptStatuses.includes(apt.status.toLocaleLowerCase()) && (myHps ?? []).some(hp => hp.id === apt.RoutedTo.id))
                  )
                )
              return enable
            })}
            render={(tool) => tool.component}
            fallback={<span className="text-xs text-muted-foreground">No Action Available</span>}
          />

        </div>
        <div className="ml-auto flex items-center gap-2">
          {
            freshAppointment.data.AppointmentAttribute?.status === "ROUTED" && freshAppointment.data.AppointmentRouting.every(routing => routing.status !== "PENDING") && [PERMISSIONS.CLINIC["COMPLETE:CLINIC:APPOINTMENT"].name].every(p => myClinicPermissionArray.includes(p)) &&
            <CompleteAppointment appointmentId={freshAppointment.data.id} onCompleted={revalidate} disabled={!freshAppointment.data.id} />
          }
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <MoreTools freshAppointment={freshAppointment.data} />
      </div>
      <Separator />
      {/* Sticky Patient Header */}
      <div className="flex items-start p-4 sticky top-[52px] bg-background z-10">
        <div className="flex items-start gap-4 text-sm">
          <Each
            of={requesters?.filter(requester => requester.User) ?? []} // Filter out requesters with null User
            render={(aptUser) => {
              const departmentName = getDepartmentName(aptUser.User);
              const programYear = getProgramYear(aptUser.User);
              const mobile = aptUser.User.mobile;
              const email = aptUser.User.email;
              
              return (
                <Fragment key={aptUser.User.userId}>
                  <Avatar>
                    {
                      aptUser.User.picture
                        ? <Image src={aptUser.User.picture} width={50} height={50} className="object-cover" alt={aptUser.User.nickname ?? ""} />
                        : <AvatarFallback>{aptUser.User.firstName?.charAt(0)} {aptUser.User.lastName?.charAt(0)}</AvatarFallback>
                    }
                  </Avatar>
                  <div className="grid gap-1">
                    <div className="font-semibold">{aptUser.User.firstName} {aptUser.User.middleName} {aptUser.User.lastName} {aptUser.User.suffix}</div>
                    <div className="line-clamp-1 text-xs">
                      <span className="font-medium">{aptUser.User.gender} / </span>{calculateAge(aptUser.User.dob) ?? ""}
                    </div>
                    {departmentName && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{departmentName}</div>
                    )}
                    {programYear && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{programYear}</div>
                    )}
                    {mobile && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{mobile}</div>
                    )}
                    {email && (
                      <div className="line-clamp-1 text-xs text-muted-foreground">{email}</div>
                    )}
                  </div>
                </Fragment>
              )
            }}
          />

        </div>
        {freshAppointment.data.createdAt && (
          <div className="ml-auto text-xs text-muted-foreground">
            {dayjs(freshAppointment.data.createdAt).format("ll")}
          </div>
        )}
      </div>
      <Separator />
      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 text-sm">
          {/* Subject moved here from header */}
          <div className="mb-2">
            <span className="font-semibold text-sm">Subject: </span>
            <span className="text-sm">{freshAppointment.data?.subject}</span>
          </div>
          <Separator className="my-2" />
          <div className="mb-2">
            <span className="font-semibold text-sm">Chief Complaint: </span>
            <div className="mt-1 whitespace-pre-wrap">{freshAppointment.data.complaint}</div>
          </div>
          <Separator className="my-2" />
          <Attachments attachments={(freshAppointment.data.AppointmentAttachments ?? []).map(a => a.url)} />
        </div>
        
        <Separator className="my-4" />
        <div className="px-4 pb-4 text-xs">
          <div className="flex items-center mb-2">
            <span className="font-semibold text-base">Latest Pre-Assessment Notes</span>
            <Pencil className="h-4 w-4 ml-auto" />
          </div>
          <Each
            of={(freshAppointment.data.PreAssessmentNotes ?? []).slice(-1)}
            fallback={
              canEditPreAssessmentNotes ? (
                <PreAssessmentNoteSheet
                  disabled={false}
                  key={freshAppointment.data.id}
                  preAssessmentNotes={{
                    assessment: "",
                    homeInstructions: "",
                    remarks: "",
                    appointmentId: freshAppointment.data!.id,
                    clinicUid
                  }}
                >
                  <span className="text-muted-foreground cursor-pointer hover:underline">No Pre-Consultation Notes, click here to create</span>
                </PreAssessmentNoteSheet>
              ) : (
                <span className="text-muted-foreground">You do not have permission to edit pre-consultation notes.</span>
              )
            }
            render={(preAssessmentNote) => {
              return (
                <PreAssessmentNoteSheet
                  key={preAssessmentNote.id}
                  disabled={!freshAppointment || !canEditPreAssessmentNotes}
                  preAssessmentNotes={{
                    ...preAssessmentNote,
                    homeInstructions: preAssessmentNote.homeInstructions ?? "",
                    appointmentId: freshAppointment.data!.id,
                    clinicUid
                  }}
                >
                  <div className="cursor-pointer">
                    <LabelValue className="flex items-center gap-2" label={preAssessmentNote.assessment} value="Pre-Assessment:" />
                    {preAssessmentNote.homeInstructions && <LabelValue className="flex items-center gap-2" label={preAssessmentNote.homeInstructions} value="Home Instruction:" />}
                    <LabelValue className="flex items-center gap-2" label={preAssessmentNote.remarks} value="Remarks:" />
                    {(() => {
                      const fullName = getFullName({
                        firstName: preAssessmentNote.CreatedBy?.firstName ?? "",
                        middleName: preAssessmentNote.CreatedBy?.middleName ?? "",
                        lastName: preAssessmentNote.CreatedBy?.lastName ?? "",
                        suffix: preAssessmentNote.CreatedBy?.suffix ?? ""
                      });
                      return (
                        <LabelValue
                          className="flex items-center gap-2"
                          label={fullName || "N/A"}
                          value="Noted by:"
                        />
                      );
                    })()}
                  </div>
                </PreAssessmentNoteSheet>
              )
            }} />
        </div>
        <Separator className="my-4" />
        <div className="px-4 pb-4 text-xs">
          <span className="font-semibold text-base">{freshAppointment.data.AppointmentAttribute?.status !== "ROUTED" ? "Preferred" : "Assigned"} Schedule</span> <br />
          {freshAppointment.data.AppointmentAttribute?.date && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.date).format("ll - dddd")} value="Date:" />}
          {(freshAppointment.data.AppointmentAttribute?.date && freshAppointment.data.AppointmentAttribute?.timeStart && freshAppointment.data.AppointmentAttribute?.timeEnd) && <LabelValue className="flex items-center gap-2" label={`${dayjs(combineDateTime(freshAppointment.data.AppointmentAttribute.date, freshAppointment.data.AppointmentAttribute.timeStart)).format("hh:mm A")} - ${dayjs(combineDateTime(freshAppointment.data.AppointmentAttribute.date, freshAppointment.data.AppointmentAttribute.timeEnd)).format("hh:mm A")}`} value="Time:" />}
          {freshAppointment.data.AppointmentAttribute?.PreferredAppointee && <LabelValue className="flex items-center gap-2" label={preferredHPName} value={`Preferred HP:`} />}
          {meetingUrl && <div className="flex gap-2 items-center">
            <LabelValue className="flex items-center gap-2" label={meetingUrl} value={`Meeting link:`} />
            <Badge><Link href={meetingUrl} target="_blank">Join Meeting</Link></Badge>
          </div>}
        </div>
        <Separator className="my-4" />
        <div className="px-4 pb-4 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-base">Tagged (Info Only)</span>
            {[PERMISSIONS.CLINIC["WRITE:CLINIC:APPOINTMENT"].name].every(p => myClinicPermissionArray.includes(p)) && (
              <TagHPsSheet
                appointmentId={freshAppointment.data.id}
                currentTags={freshAppointment.data.AppointmentTag ?? []}
                onTagsUpdated={revalidate}
              >
                <Button variant="ghost" size="sm" className="h-6">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit Tags
                </Button>
              </TagHPsSheet>
            )}
          </div>
          <Each
            of={(freshAppointment.data.AppointmentTag ?? [])}
            fallback={<span className="text-muted-foreground text-xs">No tagged healthcare providers</span>}
            render={(tag) => (
              <div key={tag.id} className="flex gap-1 my-2 ">
                <div className="flex items-center gap-2 ">
                  <Badge variant="outline" className="text-xs font-medium ring-primary ring-1 text-primary">
                    {getHealthcareProviderName(tag.HealthcareProvider)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground ml-1">
                  {tag.HealthcareProvider.HPType?.name}
                  {tag.HealthcareProvider.HPProfile?.specialties &&
                    tag.HealthcareProvider.HPProfile.specialties.length > 0 &&
                    ` • ${tag.HealthcareProvider.HPProfile.specialties.join(", ")}`
                  }
                </div>
              </div>
            )}
          />
        </div>
        <Separator className="my-4" />
        <div className="flex items-center px-4 pb-4 gap-2 flex-wrap">
          <Badge variant={getBadgeVariantFromLabel(freshAppointment.data.AppointmentAttribute?.AppointmentType.name ?? "")}>
            {freshAppointment.data.AppointmentAttribute?.AppointmentType.name}
          </Badge>
          <Badge variant="outline">
            {freshAppointment.data.AppointmentAttribute?.AppointmentMode.name}
          </Badge>
          <Badge variant="secondary">
            {freshAppointment.data.AppointmentAttribute?.Service?.name}
          </Badge>
        </div>
      </ScrollArea>
    </div>
  )
}

interface MoreToolsProps {
  freshAppointment: GetAppointment["data"];
}

export const MoreTools = ({ freshAppointment }: MoreToolsProps) => {
  const consultationTicketTriggerRef = useRef<HTMLInputElement>(null)
  const appointmentRoutingHistoryTriggerRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <ConsultationTicketSheet
        consultationTickets={freshAppointment?.ConsultationTickets ?? []}
      >
        <input ref={consultationTicketTriggerRef} type="hidden"></input>
      </ConsultationTicketSheet>
      <AppointmentRoutingHistorySheet
        routing={freshAppointment?.AppointmentRouting ?? []}
      >
        <input ref={appointmentRoutingHistoryTriggerRef} type="hidden"></input>
      </AppointmentRoutingHistorySheet>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={!freshAppointment}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => consultationTicketTriggerRef.current?.click()}>
            View Consultation Tickets
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => appointmentRoutingHistoryTriggerRef.current?.click()}>
            View Assignment History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>

  )
}

interface AppointmentMetadataProps {
  appointment: NonNullable<GetAppointment["data"]>;
}
export const AppointmentMetadata = ({ appointment }: AppointmentMetadataProps) => {
  const receiverName = `${appointment.AppointmentAttribute?.ReceivedBy?.firstName} ${appointment.AppointmentAttribute?.ReceivedBy?.middleName} ${appointment.AppointmentAttribute?.ReceivedBy?.lastName} ${appointment.AppointmentAttribute?.ReceivedBy?.suffix ?? ""}`
  const rejectorName = `${appointment.AppointmentAttribute?.RejectedBy?.firstName} ${appointment.AppointmentAttribute?.RejectedBy?.middleName} ${appointment.AppointmentAttribute?.RejectedBy?.lastName} ${appointment.AppointmentAttribute?.RejectedBy?.suffix ?? ""}`
  const completerName = `${appointment.AppointmentAttribute?.RejectedBy?.firstName} ${appointment.AppointmentAttribute?.RejectedBy?.middleName} ${appointment.AppointmentAttribute?.RejectedBy?.lastName} ${appointment.AppointmentAttribute?.RejectedBy?.suffix ?? ""}`

  return (
    <div className="px-5 py-2 text-xs max-h-40 scrollBox no-scrollbar">
      <span className="font-semibold text-base">Meta</span> <br />
      {appointment.AppointmentAttribute?.completedAt && <LabelValue className="flex items-center gap-2" label={dayjs(appointment.AppointmentAttribute.completedAt).format("llll")} value="Date received:" />}
      {appointment.AppointmentAttribute?.CompletedBy && <LabelValue className="flex items-center gap-2" label={completerName} value="Completed by:" />}
      {appointment.AppointmentAttribute?.receivedAt && <LabelValue className="flex items-center gap-2" label={dayjs(appointment.AppointmentAttribute.receivedAt).format("llll")} value="Date received:" />}
      {appointment.AppointmentAttribute?.ReceivedBy && <LabelValue className="flex items-center gap-2" label={receiverName} value="Received by:" />}
      {appointment.AppointmentAttribute?.rejectedReason && <LabelValue className="flex items-center gap-2" label={appointment.AppointmentAttribute.rejectedReason} value="Reason of rejection:" />}
      {appointment.AppointmentAttribute?.rejectedAt && <LabelValue className="flex items-center gap-2" label={dayjs(appointment.AppointmentAttribute.rejectedAt).format("llll")} value="Date rejected:" />}
      {appointment.AppointmentAttribute?.RejectedBy && <LabelValue className="flex items-center gap-2" label={rejectorName} value="Rejected by:" />}
    </div>
  )
}