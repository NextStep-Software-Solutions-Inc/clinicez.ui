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
import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "@lib/day-utils";
import { useHP } from "@hooks/useHP";

interface ConsultationTicketSheetProps {
  children?: React.ReactNode;
  onSelect? : (e: Event) => void;
  onClose?: () => void;
  consultationTickets: NonNullable<GetAppointment["data"]>["ConsultationTickets"]
}

export default function ConsultationTicketSheet({ children, onClose, consultationTickets }: ConsultationTicketSheetProps) {
  const {clinicUid} = useParams<{clinicUid: string}>()

  return (
    <Sheet >
      <SheetTrigger asChild >{children}</SheetTrigger>
      <SheetContent side="right" className="min-w-[calc(100dvw-70%)]">
        <SheetHeader>
          <SheetTitle>Consultation Tickets</SheetTitle>
          <SheetDescription>
            Consultation tickets for this appointment.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col my-5 gap-2">
          <Each
            of={consultationTickets}
            fallback={<p className="text-center text-sm text-muted-foreground">No consultation tickets found.</p>}
            render={(record) => (
              <Link
                href={{
                  pathname: `/clinics/${clinicUid}/consultations/${record.id}`,
                }}
                target="_blank"
              >
                <ConsultationTicket record={record}/>
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

export const ConsultationTicket = ({record}: {record: NonNullable<GetAppointment["data"]>["ConsultationTickets"][number]}) => {
  
  const {data: ticketAuthor} = useHP(Number(record.ConsultationTicketHPs[0].hpId))
  const ticketAuthorName = `${ticketAuthor?.HPProfile?.title ?? ticketAuthor?.User.firstName} ${ticketAuthor?.HPProfile?.name ?? ticketAuthor?.User.lastName} ${ticketAuthor?.HPProfile?.suffix ?? ticketAuthor?.User.suffix ?? ""}`
  
  return (
    <div className="rounded px-3 py-2 bg-slate-100 hover:ring-1">
      <div>
        <p className="font-semibold text-primary text-wrap">Consultation Ticket #{record.id}</p>
        {record.subject && <p className="font-medium text-wrap">{record.subject}</p>}
        <p className="text-sm text-muted-foreground">{ticketAuthorName}</p>
        <p className="text-xs text-muted-foreground">Created {dayjs(record.updatedAt).fromNow()}</p>

      </div>
    </div>
  )
}