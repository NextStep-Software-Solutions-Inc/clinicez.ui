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
import FilterForm from "./FilterForm";
import AppointmentCalendar from "./AppointmentCalendar";
import VacantTimeSlot from "./VacantTimeSlot";
import { Separator } from "@components/ui/separator";
import BookAppointmentStep from "./BookAppointmentStep";

export default function BookAppointment() {
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
        <BookAppointmentStep intialStep={1}>
          <div className="container flex flex-col gap-4 my-10">
            <div className="flex lg:flex-row flex-col items-center gap-5 justify-center">
              <FilterForm/>
              <AppointmentCalendar/>
            </div>
            <Separator/>
            <VacantTimeSlot/>
          </div>
          <div>1</div>
        </BookAppointmentStep>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button type="submit">Book</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
