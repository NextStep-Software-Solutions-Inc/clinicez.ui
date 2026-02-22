import { cancelAppointmentRoutingAction, returnAppointmentAssignmentAction } from "@actions/appointments/appointment-routing.action";
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
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogPortal,
} from "@components/ui/alert-dialog"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import Each from "@components/utils/Each";
import { useClinicAppointment } from "@hooks/useAppointment";
import { cn } from "@lib/utils";
import dayjs from "@lib/day-utils";
import { promiseWrapper } from "@/lib/with-error-handling";

import { ArrowRight, Ban, Info, Undo2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import ActionButton from "../ActionButton";
import React from "react";

// Custom AlertDialogContent with lighter overlay for use inside Sheet
const LightAlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
LightAlertDialogOverlay.displayName = "LightAlertDialogOverlay"

const LightAlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <LightAlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
LightAlertDialogContent.displayName = "LightAlertDialogContent"
interface AppointmentRoutingHistorySheetProps {
  children?: React.ReactNode;
  onSelect?: (e: Event) => void;
  onClose?: () => void;
  routing: NonNullable<GetAppointment["data"]>["AppointmentRouting"]
}

export default function AppointmentRoutingHistorySheet({ children, onClose, routing }: AppointmentRoutingHistorySheetProps) {
  const { clinicUid } = useParams<{ clinicUid: string }>()
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
            You can right click on each routing history to view more options. You can cancel an assignment if it is still pending.
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
  record: NonNullable<GetAppointment["data"]>["AppointmentRouting"][number]
  clinicUid: string
  appointmentId: number
}
export const Route = ({ record, appointmentId, clinicUid }: RouteProps) => {
  const [showReturnDialog, setShowReturnDialog] = React.useState(false);

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
  const returnedByName = record.ReturnedByUser
    ? [record.ReturnedByUser.firstName, record.ReturnedByUser.middleName, record.ReturnedByUser.lastName, record.ReturnedByUser.suffix]
      .filter(Boolean)
      .join(" ")
    : null;

  return (
    <>
      <ContextMenu key={record.id}>
        <ContextMenuTrigger disabled={!["PENDING", "ACCEPTED"].includes(record.status)} >
          <div className={
            cn("text-sm rounded px-3 py-2 bg-slate-100 hover:ring-1",
              record.status === "CANCELLED" && "bg-destructive/5",
            )}
          >
            <Badge variant={badgeMap[record.status as keyof typeof badgeMap]} />
            <LabelValue className="flex items-center flex-wrap" value={<span className="flex items-center">{routedByName} <ArrowRight className="w-4 h-4 mx-2" /></span>} label={routedToName} />
            {record.amendment && <LabelValue className="flex items-center gap-1 text-xs text-muted-foreground" value="Amendment: " label={record.amendment} />}
            {record.returnReason && (
              <>
                <LabelValue className="flex items-center gap-1 text-xs text-orange-600" value="Return Reason: " label={record.returnReason} />
                {returnedByName && <LabelValue className="flex items-center gap-1 text-xs text-orange-500" value="Returned By: " label={returnedByName} />}
                {record.returnedAt && <p className="text-xs text-orange-500">Returned at: {dayjs(record.returnedAt).format("llll")}</p>}
              </>
            )}
            <p className="text-xs text-muted-foreground">{dayjs(record.updatedAt).format("llll")}</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {record.status === "PENDING" && (
            <ContextMenuItem>
              <CancelAssignment onCancel={() => mutate()} appointmentRoutingId={record.id} />
            </ContextMenuItem>
          )}
          {record.status === "ACCEPTED" && (
            <ContextMenuItem onSelect={() => setShowReturnDialog(true)}>
              <div className="flex items-center gap-2">
                <Undo2 className="h-4 w-4" />
                Return Assignment
              </div>
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Return dialog rendered outside of ContextMenu */}
      <ReturnAssignmentDialog
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        appointmentRoutingId={record.id}
        onReturn={() => mutate()}
      />
    </>
  )
}

export const CancelAssignment = ({ appointmentRoutingId, onCancel }: { appointmentRoutingId: number, onCancel?: () => void }) => {

  const handleCancelAssignment = () => {
    toast.promise(promiseWrapper(cancelAppointmentRoutingAction)({ appointmentRoutingId, reason: "Cancelled" }), {
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

export const ReturnAssignmentDialog = ({
  open,
  onOpenChange,
  appointmentRoutingId,
  onReturn
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentRoutingId: number;
  onReturn?: () => void;
}) => {
  const [reason, setReason] = React.useState("");

  const handleReturnAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a reason for returning the assignment");
      return;
    }

    const formData = new FormData();
    formData.append("appointmentRoutingId", appointmentRoutingId.toString());
    formData.append("reason", reason);

    toast.promise(promiseWrapper(returnAppointmentAssignmentAction)(formData), {
      loading: "Returning appointment assignment...",
      success: (res) => {
        setReason("");
        onOpenChange(false);
        onReturn?.();
        return res.message;
      },
      error: (error) => {
        return typeof error === 'string' ? error : 'Failed to return appointment assignment';
      }
    })
  }

  // Reset reason when dialog closes
  React.useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <LightAlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Return Assignment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to return this accepted appointment assignment? The appointment will be returned for reassignment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form
          onSubmit={handleReturnAssignment}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor={`reason-${appointmentRoutingId}`}>
              Reason<span className="text-destructive">*</span>
            </Label>
            <Input
              id={`reason-${appointmentRoutingId}`}
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason here"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReason("");
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <ActionButton type="submit" variant="default">
              Return Assignment
            </ActionButton>
          </div>
        </form>
      </LightAlertDialogContent>
    </AlertDialog>
  )
}