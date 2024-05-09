
import {format, addHours, addDays, nextSaturday} from "date-fns"
import {
  Send,
  MailCheck,
  MailX,
  MailPlus,
  Heart,
  ClipboardPlus,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
} from "lucide-react"

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@components/ui/avatar"
import { Button } from "@components/ui/button"
import { Calendar } from "@components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu"
import { Label } from "@components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover"
import { Separator } from "@components/ui/separator"
import { Switch } from "@components/ui/switch"
import { Textarea } from "@components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip"
import { getAppointment, sendMsgAction } from "@actions/appointments.action"
import ActionButton from "@components/ActionButton"
import CreateConsultationRecordModal from "../../components/CreateConsultationRecordModal"

interface AppointmentDisplayProps {
  appointmentId: string | null
}

export default async function AppointmentDisplay({ appointmentId }: AppointmentDisplayProps) {
  
  const freshAppointment = await getAppointment(appointmentId ?? "")
  const today = new Date()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <MailCheck className="h-4 w-4" />
                <span className="sr-only">Accept</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <MailX className="h-4 w-4" />
                <span className="sr-only">Reject</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reject</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <MailPlus className="h-4 w-4" />
                <span className="sr-only">Receive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Receive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Reschedule</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-full p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Reschedule to</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Reschedule</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          
          <CreateConsultationRecordModal/>
            
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!freshAppointment}>
                <Forward className="h-4 w-4" />
                <span className="sr-only">Forward</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!freshAppointment}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>More Action Here</DropdownMenuItem>
            <DropdownMenuItem>More Action Here</DropdownMenuItem>
            <DropdownMenuItem>More Action Here</DropdownMenuItem>
            <DropdownMenuItem>More Action Here</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {freshAppointment ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage src={freshAppointment.patientAvatar} alt={freshAppointment.name} />
                <AvatarFallback>
                  {freshAppointment.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{freshAppointment.name}</div>
                <div className="line-clamp-1 text-xs">{freshAppointment.subject}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Email:</span> {freshAppointment.email}
                </div>
              </div>
            </div>
            {freshAppointment.createdAt && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(freshAppointment.createdAt), "PPpp")}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
            {freshAppointment.complaint}
          </div>
          <Separator className="mt-auto" />
          <div className="p-4">
            <form action={sendMsgAction}>
              <div className="grid gap-4">
                <Textarea
                  className="p-4"
                  name="msg"
                  value="hey"
                  placeholder={`Reply ${freshAppointment.name}...`}
                />
                <div className="flex items-center">
                  <Label
                    htmlFor="mute"
                    className="flex items-center gap-2 text-xs font-normal"
                  >
                    <Switch id="mute" aria-label="Mute thread" /> Mute this
                    thread
                  </Label>
                  <ActionButton
                    size="sm"
                    className="ml-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />Send
                  </ActionButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  )
}
