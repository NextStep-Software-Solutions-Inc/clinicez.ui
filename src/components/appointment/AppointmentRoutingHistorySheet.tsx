import { cancelAppointmentRoutingAction } from "@actions/appointments/appointment-routing.action";
import { GetAppointment } from "@actions/appointments/appointments.action";
import { LabelValue } from "@components/LabelValue";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Badge, BadgeProps } from "@components/ui/badge";
import { Button } from "@components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@components/ui/context-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet"
import Each from "@components/utils/Each";
import { useClinicAppointment } from "@hooks/useAppointment";
import { cn } from "@lib/utils";
import dayjs from "@lib/day-utils";
import { promiseWrapper } from "@/lib/with-error-handling";

import { ArrowRight, Ban, Info } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
interface AppointmentRoutingHistorySheetProps {
  children?: React.ReactNode;
  onSelect? : (e: Event) => void;
  onClose?: () => void;
  routing: NonNullable<GetAppointment["data"]>["AppointmentRouting"]
}

export default function AppointmentRoutingHistorySheet({ children, onClose, routing }: AppointmentRoutingHistorySheetProps) {
  const {clinicUid} = useParams<{clinicUid: string}>()
  const searchParams = useSearchParams()
  const appointmentId = Number(searchParams.get("_appointment"))
  
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="min-w-[calc(100dvw-70%)]">
        <SheetHeader>
          <SheetTitle>Routing History</SheetTitle>
          <SheetDescription>
            View appointment routing history.
          </SheetDescription>
        </SheetHeader>
        <Alert className="my-5">
          <Info className="h-4 w-4" />
          <AlertTitle>Tips!</AlertTitle>
          <AlertDescription>
            You can right click on each routing history to view more options. You can cancel an assignment if it is pending or accepted.
          </AlertDescription>
        </Alert>
        <div className="my-2 flex flex-col gap-2">
          <Each
            of={routing}
            fallback={<p className="text-center text-sm text-muted-foreground">No routing history found.</p>}
            render={(record) => (
              <Route 
                key={record.id}
                record={record}
                appointmentId={appointmentId}
                clinicUid={clinicUid}
              />
            )}
          />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button" onClick={onClose}>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface RouteProps {
  record:  NonNullable<GetAppointment["data"]>["AppointmentRouting"][number]
  clinicUid: string
  appointmentId: number
}
export const Route = ({record, appointmentId, clinicUid}: RouteProps ) => {

  const badgeMap: Record<string, BadgeProps["variant"]> = {
    ACCEPTED: "default",
    PENDING: "outline",
    DECLINED: "destructive",
    CANCELLED: "destructive",
  } as const

  const { mutate } = useClinicAppointment({
    clinicUid,
    appointmentId: appointmentId
  })


  const routedByName = `${record.RoutedBy.firstName} ${record.RoutedBy.middleName} ${record.RoutedBy.lastName} ${record.RoutedBy.suffix ?? ""}`
  const routedToName = `${record.RoutedTo.HPProfile?.title || record.RoutedTo.User.firstName} ${record.RoutedTo.HPProfile?.name || record.RoutedTo.User.lastName} ${record.RoutedTo.HPProfile?.suffix || record.RoutedTo.User.suffix || ""}`

  return (
    <ContextMenu key={record.id}>
      <ContextMenuTrigger disabled={!["PENDING", "ACCEPTED"].includes(record.status)} >
        <div className={
          cn("text-sm rounded px-3 py-2 bg-slate-100 hover:ring-1", 
            record.status === "CANCELLED" && "bg-destructive/5",
          )}
        >
          <Badge variant={badgeMap[record.status as keyof typeof badgeMap]} />
          <LabelValue className="flex items-center flex-wrap" value={<span className="flex items-center">{routedByName} <ArrowRight className="w-4 h-4 mx-2"/></span>} label={routedToName} />
          {record.amendment && <LabelValue className="flex items-center gap-1 text-xs text-muted-foreground" value="Amendment: " label={record.amendment} />}
          <p className="text-xs text-muted-foreground">{dayjs(record.updatedAt).format("llll")}</p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <CancelAssignment onCancel={() => mutate()} appointmentRoutingId={record.id}/>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const CancelAssignment = ({appointmentRoutingId, onCancel}: {appointmentRoutingId: number, onCancel?: () => void}) => {
  
  const handleCancelAssignment = () => {
    toast.promise(promiseWrapper(cancelAppointmentRoutingAction)(appointmentRoutingId), {
      loading: "Cancelling assignment...",
      success: (res) => {
        onCancel?.()
        return res.message
      },
      error: (error) => error
    })
  }

  return (
    <div className="flex items-center gap-2" onClick={handleCancelAssignment}>
      <Ban className="h-4 w-4" />
      Cancel Assignment
    </div>
  )
}