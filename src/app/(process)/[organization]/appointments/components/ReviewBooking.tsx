"use client";

import { createAppointmentAction } from "@actions/appointments/appointments.action";
import BackSubmitAndNext from "@components/SubmitAndNext";
import React, { FormEvent } from "react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import useSound from "use-sound";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useParams } from "next/navigation";
import { uploadMediaAction } from "@actions/blob.action";
import { mutate } from "swr";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import { LabelValue } from "@components/LabelValue";
import Each from "@components/utils/Each";
import { Separator } from "@components/ui/separator";
import { useOrgServices } from "@hooks/useOrgService";
import { useOrgAppointmentTypes } from "@hooks/useOrgAppointmentType";
import { useOrgAppointmentModes } from "@hooks/useOrgAppointmentMode";

interface ReviewBookingProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
    setComplete?: (value: boolean) => void;
    startOver?: () => void;
}

export default function ReviewBooking({ nextStep, prevStep, isLastStep, isFirstStep, setComplete, startOver }: ReviewBookingProps) {
  const [bookAppointmentForm, setBookAppointmentForm] = useAtom(bookAppointmentAtom);
  const params = useParams<{organization: string}>();
  const { data: services } = useOrgServices({orgUid: params.organization});
  const { data: appointmentTypes } = useOrgAppointmentTypes(params.organization);
  const { data: appointmentModes } = useOrgAppointmentModes(params.organization);
  const [playSuccess] = useSound("/audio/success-1.mp3");
  const user = useUser()
  const userId = user.user?.sub

  const handleBookAppointment = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if(!params.organization) {
      toast.error("Organization is required")
      return ;
    }
    if(!user.user?.email) {
      toast.error("User email is missing")
      return;
    }
    if (!bookAppointmentForm.appointmentTypeId) {
      toast.error("Appointment type is required")
      return;
    }
    if (!bookAppointmentForm.modeId) {
      toast.error("Mode is required")
      return;
    }
    if (!bookAppointmentForm.serviceId) {
      toast.error("Service is required")
      return;
    }
    if (!bookAppointmentForm.hpEmail) {
      toast.error("Doctor is required")
      return;
    }
    if (!bookAppointmentForm.selectedTimeSlot?.start || !bookAppointmentForm.selectedTimeSlot?.end) {
      toast.error("Time slot is required")
      return;
    }
    if(!bookAppointmentForm.preferredDate) {
      toast.error("Preferred date is required")
      return;
    }

    if(!userId) {
      return  toast.error("User not found")
    }

    let attachmentUrls:{url: string}[] = []
    
    for (const file of bookAppointmentForm.attachments ?? []) {
      toast.loading(`Uploading ${file.name}...`)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      const formData = new FormData();
      formData.append("media", file);
      formData.append("directory", `${userId}/appointment/attachments`);
      const url = await uploadMediaAction(formData);
      attachmentUrls.push(url);
      toast.dismiss();
    }

    toast.promise(createAppointmentAction({
      orgUid: params.organization,
      subject: bookAppointmentForm.subject ?? "Appointment Request",
      complaint: bookAppointmentForm.chiefComplaint,
      modeId: bookAppointmentForm.modeId,
      typeId: bookAppointmentForm.appointmentTypeId,
      serviceId: bookAppointmentForm.serviceId,
      requesters: [user.user?.email],
      attachments: attachmentUrls.map(url => url.url),
      hpEmail: bookAppointmentForm.hpEmail,
      schedule: {
        timeStart: bookAppointmentForm.selectedTimeSlot?.start,
        timeEnd: bookAppointmentForm.selectedTimeSlot?.end,
        date: dayjs(bookAppointmentForm.preferredDate).endOf("day").toDate(),
      }
    }), {
      loading: "Creating appointment...",
      success: () => {
        setComplete?.(true);
        playSuccess();
        mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/organizations/${params.organization}/appointments`), undefined, {
          revalidate:true
        })
        return "Appointment created successfully";
      },
      error: "Failed to create appointment"
    })
  }

  const reset = async () => {
    setBookAppointmentForm({})
    startOver?.();
  }

  return (
    <div className="shadow-lg p-8 space-y-5 bg-white rounded-md">
      <h2 className="text-2xl  font-bold ">Review details</h2>
      <form onSubmit={handleBookAppointment} >
        <div className="p-5 mb-5 space-y-2 text-sm bg-gray-100 rounded-sm select-none">
          <LabelValue className="flex items-center gap-2" value="Subject:" label={bookAppointmentForm.subject ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Chief Complaint:" label={bookAppointmentForm.chiefComplaint ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Appointment Mode:" label={appointmentModes?.find(a => a.id === bookAppointmentForm.modeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Appointment Type:" label={appointmentTypes?.find(a => a.id === bookAppointmentForm.appointmentTypeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Service:" label={services?.find(s => s.id === bookAppointmentForm.serviceId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Preferred Doctor:" label={bookAppointmentForm.hpEmail ?? ""} />
          {!!bookAppointmentForm.preferredDate && <LabelValue className="flex items-center gap-2" value="Preferred Date:" label={dayjs(bookAppointmentForm.preferredDate).format("ll")} /> }
          <LabelValue className="flex items-center gap-2" value="Time Slot:" label={`${dayjs(bookAppointmentForm.selectedTimeSlot?.start).format("LT")} - ${dayjs(bookAppointmentForm.selectedTimeSlot?.end).format("LT")}`} />
          <Separator/>
          <Each
            of={bookAppointmentForm.attachments ?? []}
            fallback={<p>No attachments</p>}
            render={(attachment, index) => (
              <LabelValue key={index} className="flex items-center gap-2"  value={`Attachment #${index+1}:`} label={attachment.name} />
            )}
          />
        </div>
       
        <BackSubmitAndNext
          labels={{
            submit: "Book Appointment",
            previous: "Back",
            next: "Start Over"
      
          }}
          disabled={{
            previous: isFirstStep,
          }}
          actions={{
            next: isLastStep? reset : nextStep,
            previous: prevStep,
          }}
        />
      </form>
    </div>
  );
}
