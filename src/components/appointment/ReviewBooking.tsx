"use client";

import { createAppointmentAction } from "@actions/appointments/appointments.action";
import BackSubmitAndNext from "@components/SubmitAndNext";
import React, { FormEvent } from "react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import useSound from "use-sound";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useUser as useDbUser } from "@hooks/useUser";
import { useParams } from "next/navigation";
import { uploadMediaAction } from "@actions/blob.action";
import { mutate } from "swr";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
dayjs.extend(utc)

import { LabelValue } from "@components/LabelValue";
import Each from "@components/utils/Each";
import { Separator } from "@components/ui/separator";
import { useClinicServices } from "@/hooks/useClinicService";
import { useOrgAppointmentTypes } from "@hooks/useOrgAppointmentType";
import { useOrgAppointmentModes } from "@hooks/useOrgAppointmentMode";
import { useHP } from "@hooks/useHP";
import { Button } from "@components/ui/button";

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
  const params = useParams<{clinicUid: string}>();
  const user = useUser()
  const { data: services } = useClinicServices({clinicUid: params.clinicUid});
  const { data: appointmentTypes } = useOrgAppointmentTypes(params.clinicUid);
  const { data: appointmentModes } = useOrgAppointmentModes(params.clinicUid);
  const {data: hp } = useHP(bookAppointmentForm.hpId ?? 0)
  const {data: dbUser } = useDbUser({ userId: bookAppointmentForm.requester }); 

  const [playSuccess] = useSound("/audio/success-1.mp3");

  const handleBookAppointment = async (e:FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if(!params.clinicUid) {
      toast.error("Clinic UID is required")
      return ;
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
    if (!bookAppointmentForm.hpId) {
      toast.error("Healthcare Provider is required")
      return;
    }
    if(bookAppointmentForm.bookAFriend) {

    }
    const requester = bookAppointmentForm.bookAFriend ? bookAppointmentForm.requester: user.user?.sub;
    if(!requester) {
      toast.error("Requester ID is required")
      return;
    }

    let attachmentUrls:{url: string}[] = []
    
    for (const attachment of bookAppointmentForm.attachments ?? []) {
      toast.loading(`Uploading ${attachment.name}...`)
      if (attachment.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      const formData = new FormData();
      formData.append("media", attachment);
      formData.append("directory", `${requester}/appointment/attachments`);
      const url = await uploadMediaAction(formData);
      attachmentUrls.push(url);
      toast.dismiss();
    }

    toast.promise(createAppointmentAction({
      clinicUid: params.clinicUid,
      subject: bookAppointmentForm.subject ?? "Appointment Request",
      complaint: bookAppointmentForm.chiefComplaint,
      modeId: bookAppointmentForm.modeId,
      typeId: bookAppointmentForm.appointmentTypeId,
      serviceId: bookAppointmentForm.serviceId,
      requesters: [requester],
      attachments: attachmentUrls.map(url => url.url),
      hpId: bookAppointmentForm.hpId,
      schedule: {
        timeStart: bookAppointmentForm.selectedTimeSlot?.start.toISOString().split("T")[1],
        timeEnd: bookAppointmentForm.selectedTimeSlot?.end.toISOString().split("T")[1],
        date: dayjs(bookAppointmentForm.preferredDate).endOf("day").toDate(),
      }
    }), {
      loading: "Creating appointment...",
      success: (res) => {
        if(res.status){
          setComplete?.(true);
          playSuccess();
          mutate((key) =>  typeof key === 'string' && key.startsWith(`/api/clinics/${params.clinicUid}/appointments`), undefined, {
            revalidate:true
          })
        }
        return res.message;
      },
      error: "Failed to create appointment",
      position:"top-center"
    })
  }

  const reset = async () => {
    setBookAppointmentForm({})
    startOver?.();
  }

  const preferredHp = `${hp?.HPProfile?.title} ${hp?.HPProfile?.name} ${hp?.HPProfile?.suffix}`
  const requesterName = `${dbUser?.data?.firstName || "-"} ${dbUser?.data?.middleName || ""} ${dbUser?.data?.lastName || "-"} ${dbUser?.data?.suffix || ""}`
  return (
    <div className="shadow-lg p-8 space-y-5 bg-white rounded-md">
      <h2 className="text-2xl  font-bold ">Review details</h2>
      <form onSubmit={handleBookAppointment}>
        <div className="p-5 mb-5 space-y-2 text-sm bg-gray-100 rounded-sm select-none">
          {
            bookAppointmentForm.bookAFriend && (
              <>
                <LabelValue className="flex items-center gap-2" value="Book a friend:" label="Yes" />
                <LabelValue className="flex items-center gap-2" value="Requesting Patient:" label={requesterName} />
              </>
            )
          }
          <LabelValue className="flex items-center gap-2" value="Subject:" label={bookAppointmentForm.subject ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Chief Complaint:" label={bookAppointmentForm.chiefComplaint ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Appointment Mode:" label={appointmentModes?.find(a => a.id === bookAppointmentForm.modeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Appointment Type:" label={appointmentTypes?.find(a => a.id === bookAppointmentForm.appointmentTypeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Service:" label={services?.find(s => s.id === bookAppointmentForm.serviceId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Preferred Healthcare Provider:" label={preferredHp} />
          
          {!!bookAppointmentForm.preferredDate && <LabelValue className="flex items-center gap-2" value="Preferred Date:" label={dayjs(bookAppointmentForm.preferredDate).format("ll")} /> }
          {bookAppointmentForm.selectedTimeSlot?.start && bookAppointmentForm.selectedTimeSlot?.end && <LabelValue className="flex items-center gap-2" value="Time Slot:" label={`${dayjs(bookAppointmentForm.selectedTimeSlot.start).format("LT")} - ${dayjs(bookAppointmentForm.selectedTimeSlot.end).format("LT")}`} />}
          <Separator/>
          <Each
            of={bookAppointmentForm.attachments ?? []}
            fallback={<p>No attachments</p>}
            render={(attachment, index) => (
              <LabelValue key={index} className="flex items-center gap-2"  value={`Attachment #${index+1}:`} label={attachment.name} />
            )}
          />
        </div>
       
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BackSubmitAndNext
            labels={{
              submit: "Book Appointment",
              previous: "Back",
            }}
            disabled={{
              previous: isFirstStep,
              next: true
            }}
            actions={{
              next: isLastStep? reset : nextStep,
              previous: prevStep,
            }}
          />
          <Button variant="outline" type="button" onClick={isLastStep? reset : nextStep}>
          Start Over
          </Button>
        </div>
      </form>
    </div>
  );
}
