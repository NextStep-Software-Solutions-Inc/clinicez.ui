"use client";

import { createAppointmentAction } from "@actions/appointments/appointments.action";
import BackSubmitAndNext from "@components/SubmitAndNext";
import React, { FormEvent } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import useSound from "use-sound";
import { useAtom } from "jotai";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useUser as useDbUser } from "@hooks/useUser";
import { uploadMediaAction } from "@actions/blob.action";
import { mutate } from "swr";
import dayjs from "@lib/day-utils";


import { LabelValue } from "@components/LabelValue";
import Each from "@components/utils/Each";
import { Separator } from "@components/ui/separator";
import { useClinicServices } from "@/hooks/useClinicService";
import { useClinicAppointmentTypes } from "@hooks/useOrgAppointmentType";
import { useClinicAppointmentModes } from "@hooks/useOrgAppointmentMode";
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
  const { user } = useUser()
  const clinicUid = bookAppointmentForm.clinicUid;
  
  const { data: services } = useClinicServices({ clinicUid: clinicUid || "" });
  const { data: appointmentTypes } = useClinicAppointmentTypes(clinicUid || "");
  const { data: appointmentModes } = useClinicAppointmentModes(clinicUid || "");
  const { data: hp } = useHP(bookAppointmentForm.hpId ?? 0)
  const { data: dbUser } = useDbUser({ userId: bookAppointmentForm.requester });

  const [playSuccess] = useSound("/audio/success-1.mp3");

  const handleBookAppointment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!bookAppointmentForm.clinicUid) {
      toast.error("Clinic UID is required")
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
    // if (!bookAppointmentForm.hpId) {
    //   toast.error("Healthcare Provider is required")
    //   return;
    // }
    if (bookAppointmentForm.bookAFriend) {

    }
    const requester = bookAppointmentForm.bookAFriend ? bookAppointmentForm.requester : user?.id;
    if (!requester) {
      toast.error("Requester ID is required")
      return;
    }

    let attachmentUrls: { url: string }[] = []

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
      clinicUid: bookAppointmentForm.clinicUid,
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
        if (res.status) {
          setComplete?.(true);
          playSuccess();
          mutate((key) => typeof key === 'string' && key.startsWith(`/api/clinics/${bookAppointmentForm.clinicUid}/appointments`), undefined, {
            revalidate: true
          })
        }
        return res.message;
      },
      error: "Failed to create appointment",
      position: "top-center"
    })
  }

  const reset = async () => {
    setBookAppointmentForm(state => ({
      clinicUid: state.clinicUid,
      bookAFriend: state.bookAFriend,
      requester: state.requester,
      orgUid: state.orgUid,
    }))
    startOver?.();
  }

  const preferredHp = React.useMemo(() => {
    if (!hp) return "No Healthcare Provider Selected";
    const title = hp?.HPProfile?.title ?? "";
    const name = hp?.HPProfile?.name ?? "";
    const suffix = hp?.HPProfile?.suffix ?? "";
    const profName = `${title} ${name} ${suffix}`.replace(/\s+/g, " ").trim();
    if (profName) return profName;

    const firstName = hp?.User?.firstName ?? "";
    const middleName = hp?.User?.middleName ?? "";
    const lastName = hp?.User?.lastName ?? "";
    const userSuffix = hp?.User?.suffix ?? "";
    const userName = `${firstName} ${middleName} ${lastName} ${userSuffix}`.replace(/\s+/g, " ").trim();
    return userName || "No Healthcare Provider Selected";
  }, [hp]);
  const requesterName = `${dbUser?.data?.firstName || "-"} ${dbUser?.data?.middleName || ""} ${dbUser?.data?.lastName || "-"} ${dbUser?.data?.suffix || ""}`.replace(/\s+/g, " ").trim();
  return (
    <div className="shadow-lg p-8 space-y-5 bg-white/20 dark:bg-gray-800/20 rounded-md">
      <h2 className="text-2xl  font-bold dark:text-white/50">Review details</h2>
      <form onSubmit={handleBookAppointment}>
        <div className="p-5 mb-5 space-y-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-sm select-none">
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
          <LabelValue className="flex items-center gap-2" value="Appointment Type:" label={appointmentModes?.find(a => a.id === bookAppointmentForm.modeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Consultation Type:" label={appointmentTypes?.find(a => a.id === bookAppointmentForm.appointmentTypeId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Service:" label={services?.find(s => s.id === bookAppointmentForm.serviceId)?.name ?? ""} />
          <LabelValue className="flex items-center gap-2" value="Preferred Healthcare Provider:" label={preferredHp} />

          {!!bookAppointmentForm.preferredDate && <LabelValue className="flex items-center gap-2" value="Preferred Date:" label={dayjs(bookAppointmentForm.preferredDate).format("ll")} />}
          {bookAppointmentForm.selectedTimeSlot?.start && bookAppointmentForm.selectedTimeSlot?.end && <LabelValue className="flex items-center gap-2" value="Time Slot:" label={`${dayjs(bookAppointmentForm.selectedTimeSlot.start).format("LT")} - ${dayjs(bookAppointmentForm.selectedTimeSlot.end).format("LT")}`} />}
          <Separator />
          <Each
            of={bookAppointmentForm.attachments ?? []}
            fallback={<p>No attachments</p>}
            render={(attachment, index) => (
              <LabelValue key={index} className="flex items-center gap-2" value={`Attachment #${index + 1}:`} label={attachment.name} />
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
              next: isLastStep ? reset : nextStep,
              previous: prevStep,
            }}
          />
          <Button variant="outline" type="button" onClick={isLastStep ? reset : nextStep}>
            Start Over
          </Button>
        </div>
      </form>
    </div>
  );
}
