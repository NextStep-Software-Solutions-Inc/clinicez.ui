import { GetAppointment } from "@actions/appointments/appointments.action";
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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
interface ConsultationRecordSheetProps {
  children?: React.ReactNode;
  onSelect? : (e: Event) => void;
  onClose?: () => void;
  consultationRecords: NonNullable<GetAppointment["data"]>["ConsultationRecords"]
}

export default function ConsultationRecordSheet({ children, onClose, consultationRecords }: ConsultationRecordSheetProps) {
  const [open, setOpen] = useState(false);
  const params = useParams<{organization: string}>()
  const orgUid = params.organization
  const onOpenChange = (open: boolean) => {
    if(!open) onClose?.()
    setOpen(open);
  }
  return (
    <Sheet onOpenChange={onOpenChange} open={open} >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="min-w-[calc(100dvw-70%)]">
        <SheetHeader>
          <SheetTitle>Consultation Records</SheetTitle>
          <SheetDescription>
            Consultation records for this appointment.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col my-5 gap-2">
          <Each
            of={consultationRecords}
            fallback={<p className="text-center text-sm text-muted-foreground">No consultation records found.</p>}
            render={(record) => (
              <Link href={{
                pathname: `/${orgUid}/consultations/${record.id}`,
              }}>
                <div className="rounded px-3 py-2 bg-slate-100 hover:ring-1">
                  <div>
                    <p className="font-semibold text-primary text-wrap">{record.subject}</p>
                    <p className="text-sm text-muted-foreground">{record.createdBy}</p>
                    <p className="text-xs text-muted-foreground">{dayjs.tz(record.updatedAt).format("llll")}</p>

                  </div>
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
