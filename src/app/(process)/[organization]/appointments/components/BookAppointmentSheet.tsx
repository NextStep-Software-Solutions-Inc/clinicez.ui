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
import BookAppointmentStep from "./BookAppointmentStep";
import SelectTimeSlot from "./SelectTimeSlot";
import ChiefComplaint from "./ChiefComplaint";
import ConsentForm from "./ConsentForm";
import ReviewBooking from "./ReviewBooking";

export default function BookAppointmentSheet() {
  return (
    <Sheet >
      <SheetTrigger asChild>
        <Button>Book Appointment</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Book an Appointment</SheetTitle>
          <SheetDescription>
            Filter the calendar to find the best time for your appointment.
          </SheetDescription>
        </SheetHeader>
        <BookAppointmentStep initialStep={1}>
          <SelectTimeSlot/>
          <ChiefComplaint/>
          <ConsentForm/>
          <ReviewBooking/>
        </BookAppointmentStep>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
