import type { Metadata } from "next";
import { getClinicCalendarEventsAction } from "@/actions/appointments/clinic-calendar.action";
import { getHPsAction, type GetHPsType } from "@/actions/hp.actions";
import { ClinicCalendar } from "@/components/v2/appointments/ClinicCalendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clinic Calendar",
  description: "View all clinic appointments in a calendar view",
};

interface CalendarPageProps {
  params: Promise<{ clinicUid: string }>;
}

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { clinicUid } = await params;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed

  const [eventsResult, hps] = await Promise.all([
    getClinicCalendarEventsAction(clinicUid, year, month),
    getHPsAction({ clinicUid }),
  ]);

  const hpList = (hps as GetHPsType).map((hp: GetHPsType[number]) => {
    const fullName = `${hp.User.firstName ?? ""} ${hp.User.lastName ?? ""}`.trim();
    const name = hp.HPProfile?.name ?? (fullName || `HP #${hp.id}`);
    return {
      id: hp.id,
      name,
      picture: hp.HPProfile?.picture ?? null,
    };
  });

  return (
    <div className="p-4 sm:p-6 pb-10">
      <ClinicCalendar
        clinicUid={clinicUid}
        initialEvents={eventsResult.data ?? []}
        initialYear={year}
        initialMonth={month}
        hps={hpList}
      />
    </div>
  );
}
