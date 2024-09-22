"use client";

import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

import {differenceInCalendarYears } from "date-fns"
import { MoreVertical, Pencil} from "lucide-react"

import { Avatar, AvatarFallback } from "@components/ui/avatar"
import { Button } from "@components/ui/button"

import { Separator } from "@components/ui/separator"
import { ScrollArea } from "@components/ui/scroll-area"
import Image from "next/image"
import Each from "@components/utils/Each"
import { Badge } from "@components/ui/badge"
import ConsultationRecordSheet from "../../components/ConsultationRecordSheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { useParams, useSearchParams } from "next/navigation"
import { useUser as useAptUser } from "@hooks/useUser";
import { useOrgAppointment } from "@hooks/useAppointment";
import PageLoading from "@components/PageLoading";
import { revalidatePath } from "@actions/cache.action";
import { mutate } from "swr";
import { useAppointmentTools } from "../../components/useAppointmentActions";
import { useUser } from "@auth0/nextjs-auth0/client";
import Attachments from "./Attachments";
import { formatDateTime, getBadgeVariantFromLabel } from "@lib/utils";

import { LabelValue } from "@components/LabelValue";
import PreConsultationNoteSheet from "../../components/PreConsultationNoteSheet";
import { useRef } from "react";
import { GetAppointment } from "@actions/appointments/appointments.action";
import AppointmentRoutingHistorySheet from "../../components/AppointmentRoutingHistorySheet";
import CompleteAppointment from "../../components/CompleteAppointment";

dayjs.extend(utc)

export default function AppointmentDisplay() {

  const { user } = useUser()
  const params = useParams()
  const searchParams = useSearchParams()
  const organization = params?.organization as string
  const appointmentId = parseInt(searchParams.get("_appointment") ?? "")
  const {data:freshAppointment, isLoading: loadingAppointment} = useOrgAppointment({
    orgId: organization,
    appointmentId: appointmentId
  })

  const revalidate = async () => {
    revalidatePath(`${organization}/appointments`,  "page")
    mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${organization}/appointments`), undefined, {
      revalidate:true
    })
  }
  const {data: aptUser, isLoading: loadingUser} = useAptUser({email: freshAppointment?.data?.Requesters[0].email, orgUid: organization})
  const {tools: appointmentTools} = useAppointmentTools({
    appointment: freshAppointment?.data,
    revalidate
  })

  if (!appointmentId) {
    return <div className="p-8 text-center text-muted-foreground">No appointment selected</div>
  }
  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">User not found</div>
  }

  if (loadingAppointment) {
    return <PageLoading label="Loading Appointment" />
  };
  
  if (loadingUser) {
    return <PageLoading label="Loading User" />
  };

  if(!(freshAppointment && freshAppointment.data)) {
    return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>
  }

  if(!(aptUser)) {
    return <div className="p-8 text-center text-muted-foreground">User not found</div>
  }

  const myOrgPermission = aptUser.OrgUserPermissions.flatMap(p => p.Permission).map(p => p.name)
  
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="capitalize">{freshAppointment.data.AppointmentAttribute?.status}</Badge>
          {/* <RescheduleAppointment disabled={!freshAppointment} bookingDateTime={freshAppointment?.bookingDateTime? new Date(freshAppointment?.bookingDateTime): new Date()}/> */}
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Each
            key={freshAppointment.data.id}
            of={appointmentTools.filter((tool) => {
              const enable = tool.permissions.every(p => myOrgPermission.includes(p))
                && tool.appointmentStatuses.includes(freshAppointment.data!.AppointmentAttribute?.status.toLocaleLowerCase() ?? "") 
                && (tool.routedAptStatuses.length === 0 || freshAppointment.data?.AppointmentRouting.some(apt =>tool.routedAptStatuses.includes(apt.status.toLocaleLowerCase()) && apt.routedTo === user.email))
              return enable
            })}
            render={(tool) => tool.component}
            fallback={<span className="text-xs text-muted-foreground">No Action Available</span>}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {
            freshAppointment.data.AppointmentAttribute?.status === "ROUTED" && ["complete:org:appointment"].every(p => myOrgPermission.includes(p)) &&
            <CompleteAppointment appointmentId={freshAppointment.data.id} onCompleted={revalidate} disabled={!freshAppointment.data.id}/>
          }
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <MoreTools freshAppointment={freshAppointment.data}/>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Avatar>
              {
                aptUser.picture 
                  ? <Image src={aptUser.picture} width={50} height={50} className="object-cover" alt={aptUser.nickname ?? ""} />
                  : <AvatarFallback>{aptUser.firstName?.charAt(0)} {aptUser.lastName?.charAt(0)}</AvatarFallback>
              }
            </Avatar>
            <div className="grid gap-1">
              <div className="font-semibold">{aptUser.firstName} {aptUser.lastName} - <span className="i">{aptUser.email}</span></div>
              <div className="line-clamp-1 text-xs">
                <span className="font-medium">{aptUser.gender} / </span>{aptUser.dob ? differenceInCalendarYears(new Date(), aptUser.dob) : 0}
              </div>
              <div className="line-clamp-1 text-xs">{freshAppointment.data.subject}</div>

            </div>
          </div>
          {freshAppointment.data.createdAt && (
            <div className="ml-auto text-xs text-muted-foreground">
              { dayjs(freshAppointment.data.createdAt).format("ll")}
            </div>
          )}
        </div>
        <Separator />
        <ScrollArea className="flex-auto whitespace-pre-wrap p-4 text-sm h-0">
          {freshAppointment.data.complaint}
          <Separator className="my-2" />
          <Attachments attachments={(freshAppointment.data.AppointmentAttachments ?? []).map(a => a.url)}/>
        </ScrollArea>
        <Separator />
        {
          freshAppointment.data.AppointmentRouting.some(apt => apt.status === "ACCEPTED") && 
          <div className="px-5 py-2 text-xs group/action max-h-40 scrollBox no-scrollbar">
            <div className="flex items-center">
              <span className="font-semibold text-base">Latest Pre-Consultation Notes</span> 
              <Pencil className="h-4 w-4 ml-auto invisible group-hover/action:visible" />
            </div>
            <Each 
              of={(freshAppointment.data.PreConsultationNotes ?? []).slice(-1)}
              fallback={(
                <PreConsultationNoteSheet 
                  disabled={!freshAppointment}
                  key={freshAppointment.data.id}
                  preConsultationNotes={{
                    assessment: "",
                    homeInstructions:  "",
                    remarks: "",
                    appointmentId: freshAppointment.data!.id,
                    orgUid: organization
                  }}
                >
                  <span className="text-muted-foreground cursor-pointer hover:underline">No Pre-Consultation Notes, click here to create</span>
                </PreConsultationNoteSheet>
              )}
              render={(preConsultationNotes) => {
                return (
                  <PreConsultationNoteSheet 
                    key={preConsultationNotes.id}
                    preConsultationNotes={{
                      ...preConsultationNotes,
                      homeInstructions: preConsultationNotes.homeInstructions ?? "",
                      appointmentId: freshAppointment.data!.id,
                      orgUid: organization
                    }}
                  >
                    <div className="cursor-pointer">
                      <LabelValue className="flex items-center gap-2" label={preConsultationNotes.assessment} value="Assessment:" />
                      {preConsultationNotes.homeInstructions && <LabelValue className="flex items-center gap-2" label={preConsultationNotes.homeInstructions} value="Home Instruction:" />}
                      <LabelValue className="flex items-center gap-2" label={preConsultationNotes.remarks} value="Remarks:" />
                      <LabelValue className="flex items-center gap-2" label={preConsultationNotes.createdBy} value="Noted by:" />
                    </div>
                  </PreConsultationNoteSheet>
                )
              }}/>
          </div>
        }
        <Separator />
        <div className="px-5 py-2 text-xs max-h-40 scrollBox no-scrollbar">
          <span className="font-semibold text-base">Meta</span> <br />
          {freshAppointment.data?.AppointmentAttribute?.completedAt && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.completedAt).format("llll")} value="Date received:" />}
          {freshAppointment.data?.AppointmentAttribute?.completedBy && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.completedBy} value="Completed by:" />}
          {freshAppointment.data?.AppointmentAttribute?.receivedAt && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.receivedAt).format("llll")} value="Date received:" />}
          {freshAppointment.data?.AppointmentAttribute?.receivedBy && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.receivedBy} value="Received by:" />}
          {freshAppointment.data?.AppointmentAttribute?.rejectedReason && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.rejectedReason} value="Reason of rejection:" />}
          {freshAppointment.data?.AppointmentAttribute?.rejectedAt && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.rejectedAt).format("llll")} value="Date rejected:" />}
          {freshAppointment.data?.AppointmentAttribute?.rejectedBy && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.rejectedBy} value="Rejected by:" />}
        </div>
        <Separator />
        <div className="px-5 py-2 text-xs max-h-40 scrollBox no-scrollbar">
          <span className="font-semibold text-base">{freshAppointment.data.AppointmentAttribute?.status !== "ROUTED" ? "Preferred": "Assigned"} Schedule</span> <br />
          {freshAppointment.data.AppointmentAttribute?.date && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.date).format("ll - dddd")} value="Date:" />}
          {(freshAppointment.data.AppointmentAttribute?.date && freshAppointment.data.AppointmentAttribute?.timeStart && freshAppointment.data.AppointmentAttribute?.timeEnd) && <LabelValue className="flex items-center gap-2" label={`${formatDateTime(freshAppointment.data.AppointmentAttribute.date, freshAppointment.data.AppointmentAttribute.timeStart).format("hh:mm A")} - ${formatDateTime(freshAppointment.data.AppointmentAttribute.date, freshAppointment.data.AppointmentAttribute.timeEnd).format("hh:mm A")}`} value="Time:" />}
          {freshAppointment.data.AppointmentAttribute?.preferredAppointee && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.preferredAppointee ?? ""} value={`Preferred HP:`} />}
        </div>
        <Separator />
        <div className="flex items-center p-4 gap-2 max-h-40 scrollBox no-scrollbar">
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
      </div>
    </div>
  )
}

interface MoreToolsProps {
  freshAppointment: GetAppointment["data"];
}

export const MoreTools = ({freshAppointment}: MoreToolsProps) => {
  const consultationRecordTriggerRef = useRef<HTMLInputElement>(null)
  const appointmentRoutingHistoryTriggerRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <ConsultationRecordSheet
        consultationRecords={freshAppointment?.ConsultationRecords ?? []}
      >
        <input ref={consultationRecordTriggerRef} type="hidden"></input>
      </ConsultationRecordSheet>
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
          <DropdownMenuItem onClick={() => consultationRecordTriggerRef.current?.click()}>
            View Consultation Records
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => appointmentRoutingHistoryTriggerRef.current?.click()}>
            View Assignment History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>

  )
}