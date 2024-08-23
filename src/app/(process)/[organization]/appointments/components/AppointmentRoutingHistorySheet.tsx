import { GetAppointment } from "@actions/appointments/appointments.action";
import { LabelValue } from "@components/LabelValue";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button"
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
import dayjs from "dayjs";
import { CANCELLED } from "dns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
interface AppointmentRoutingHistorySheetProps {
  children?: React.ReactNode;
  onSelect? : (e: Event) => void;
  onClose?: () => void;
  routing: NonNullable<GetAppointment["data"]>["AppointmentRouting"]
}


export default function AppointmentRoutingHistorySheet({ children, onClose, routing }: AppointmentRoutingHistorySheetProps) {
  const [open, setOpen] = useState(false);
  const onOpenChange = (open: boolean) => {
    if(!open) onClose?.()
    setOpen(open);
  }
  const badgeMap = {
    ACCEPTED: "default",
    PENDING: "outline",
    DECLINED: "destructive",
    CANCELLED: "destructive",
  } as const

  return (
    <Sheet onOpenChange={onOpenChange} open={open} >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="min-w-[calc(100dvw-70%)]">
        <SheetHeader>
          <SheetTitle>Routing History</SheetTitle>
          <SheetDescription>
            View appointment routing history.
          </SheetDescription>
        </SheetHeader>
        <div className="my-5 flex flex-col gap-2">
          <Each
            of={routing}
            fallback={<p className="text-center text-sm text-muted-foreground">No routing history found.</p>}
            render={(record) => (
              <Link href={{
                pathname: `/${"org"}/consultations/${record.id}`,
              }}>
                <div className="text-sm rounded px-3 py-2 bg-slate-100 hover:ring-1 ">
                  <Badge variant={badgeMap[record.status as keyof typeof badgeMap]} />
                  <LabelValue className="flex items-center flex-wrap" value={<span className="flex items-center">{record.routedBy} <ArrowRight className="w-4 h-4 mx-2"/></span>} label={record.routedTo} />
                  {record.amendment && <LabelValue className="flex items-center gap-1 text-xs text-muted-foreground" value="Amendment: " label={record.amendment} />}
                  <p className="text-xs text-muted-foreground">{dayjs(record.updatedAt).format("llll")}</p>
                </div>

              </Link>
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
