"use client";

import {differenceInCalendarYears } from "date-fns"
import {
  Forward,
  MoreVertical,
  Pencil,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@components/ui/avatar"
import { Button } from "@components/ui/button"

import { Separator } from "@components/ui/separator"
import { ScrollArea } from "@components/ui/scroll-area"
import Image from "next/image"
import Each from "@components/utils/Each"
import { Badge } from "@components/ui/badge"
import ConsultationRecordSheet from "../../components/ConsultationRecordSheet"
import { SheetTrigger } from "@components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@components/ui/dropdown-menu"
import { useParams, useSearchParams } from "next/navigation"
import { useUser as useAptUser } from "@hooks/useUser";
import { useOrgAppointment } from "@hooks/useAppointment";
import PageLoading from "@components/PageLoading";
import { revalidatePath } from "@actions/cache.action";
import { mutate } from "swr";
import { useAppointmentTools } from "../../components/useAppointmentActions";
import { userDefaultOrganizationRoleAtom } from "@state/user-role";
import { useAtomValue } from "jotai";
import { useUser } from "@auth0/nextjs-auth0/client";
import Attachments from "./Attachments";
import { cn, getBadgeVariantFromLabel } from "@lib/utils";
import dayjs from "dayjs";
import { LabelValue } from "@components/LabelValue";
import PreConsultationNoteSheet from "../../components/PreConsultationNoteSheet";
import { useRef, useState } from "react";
import { GetAppointment } from "@actions/appointments/appointments.action";
import AppointmentRoutingHistorySheet from "../../components/AppointmentRoutingHistorySheet";

export default function AppointmentDisplay() {

  const { user } = useUser()
  const params = useParams()
  const searchParams = useSearchParams()
  const organization = params?.organization as string
  const appointmentId = parseInt(searchParams.get("_appointment") ?? "")
  const activeRole = useAtomValue(userDefaultOrganizationRoleAtom)[organization]?.roleName?.toLowerCase()
  const {data:freshAppointment, isLoading: loadingAppointment} = useOrgAppointment({
    orgId: organization,
    appointmentId: appointmentId
  })

  const {data: aptUser, isLoading: loadingUser} = useAptUser({email: freshAppointment?.data?.Requesters[0].email})
  const {tools: appointmentTools} = useAppointmentTools({
    appointment: freshAppointment?.data,
    revalidate : async () => {
      revalidatePath(`${organization}/appointments`,  "page")
      mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${organization}/appointments`), undefined, {
        revalidate:true
      })
    }
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
              const enable = tool.roles.includes(activeRole ?? "") 
                && tool.appointmentStatuses.includes(freshAppointment.data!.AppointmentAttribute?.status.toLocaleLowerCase() ?? "") 
                && (tool.routedAptStatuses.length === 0 || freshAppointment.data?.AppointmentRouting.some(apt =>tool.routedAptStatuses.includes(apt.status.toLocaleLowerCase()) && apt.routedTo === user.email))
              return enable
            })}
            render={(tool) => tool.component}
            fallback={<span className="text-xs text-muted-foreground">No Action Available</span>}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip> */}
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
              { dayjs.tz(freshAppointment.data.createdAt).format("ll")}
            </div>
          )}
        </div>
        <Separator />
        <ScrollArea className="flex-auto whitespace-pre-wrap p-4 text-sm  h-0">
          {freshAppointment.data.complaint}
            
          <Separator className="my-2" />
          <Attachments attachments={(freshAppointment.data.AppointmentAttachments ?? []).map(a => a.url)}/>
        </ScrollArea>
        <Separator />
        {
          freshAppointment.data.AppointmentRouting.some(apt => apt.status === "ACCEPTED") && 
          <div className="px-5 py-2 text-xs group/action">
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
        <div className="px-5 py-2 text-xs">
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
        <div className="px-5 py-2 text-xs">
          <span className="font-semibold text-base">{freshAppointment.data.AppointmentAttribute?.status !== "ROUTED" ? "Preferred": "Assigned"} Schedule</span> <br />
          {freshAppointment.data.AppointmentAttribute?.date && <LabelValue className="flex items-center gap-2" label={dayjs(freshAppointment.data.AppointmentAttribute.date).format("ll - dddd")} value="Date:" />}
          {(freshAppointment.data.AppointmentAttribute?.timeStart && freshAppointment.data.AppointmentAttribute?.timeEnd) && <LabelValue className="flex items-center gap-2" label={`${dayjs(freshAppointment.data.AppointmentAttribute.timeStart).format("hh:mm A")} - ${dayjs(freshAppointment.data.AppointmentAttribute.timeEnd).format("hh:mm A")}`} value="Time:" />}
          {freshAppointment.data.AppointmentAttribute?.preferredAppointee && <LabelValue className="flex items-center gap-2" label={freshAppointment.data.AppointmentAttribute.preferredAppointee ?? ""} value={`Preferred HP:`} />}
        </div>
        <Separator />
        <div className="flex items-center p-4 gap-2">
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
  const [open, setOpen] = useState(false)

  const handleClose = () => {
    setOpen(false)
  }
  return (
    <DropdownMenu open={open}>
      <DropdownMenuTrigger asChild onClick={() => setOpen(prev => !prev)}>
        <Button variant="ghost" size="icon" disabled={!freshAppointment}>
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ConsultationRecordSheet 
          onClose={handleClose}
          consultationRecords={freshAppointment?.ConsultationRecords ?? []}
        >
          <SheetTrigger asChild>
            <DropdownMenuItem>
              View Consultation Records
            </DropdownMenuItem>
          </SheetTrigger>
        </ConsultationRecordSheet>
        <AppointmentRoutingHistorySheet onClose={handleClose}
          routing={freshAppointment?.AppointmentRouting ?? []}
        >
          <SheetTrigger asChild>
            <DropdownMenuItem>
            View Assignment History
            </DropdownMenuItem>
          </SheetTrigger>
        </AppointmentRoutingHistorySheet>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}