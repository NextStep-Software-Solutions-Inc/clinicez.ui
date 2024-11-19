"use client";

import React from "react";
import { Picture } from "../../app/(main)/user/[user]/phr/Picture";
import { useUser as useDBUser } from "@hooks/useUser";
import { notFound } from "next/navigation";
import { LabelValue } from "@components/LabelValue";
import { differenceInCalendarYears } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { useClinicRoles } from "@/hooks/useClinicRole";
import { useClinicAppointments } from "@hooks/useAppointment";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ClinicMemberTabSection from "./ClinicMemberTabSection";
dayjs.extend(relativeTime);

interface ClinicMemberDetailsProps {
  userId: string;
  clinicUid: string;
}
export default function ClinicMemberDetails({userId, clinicUid}:ClinicMemberDetailsProps) {
  const {data: user, isLoading} = useDBUser({ userId });
  
  const {data: roles} = useClinicRoles({userId});
  const {data: appointments} = useClinicAppointments({clinicUid, userId });
  
  if(isLoading) return <div>Loading user...</div>
  if(!user?.data) notFound()
  return (
    <>
      <Card className="bg-slate-100">
        <CardContent className="mt-5">
          <div className="flex flex-wrap gap-5">
            <Picture readOnly user={user?.data}/>
            <div className="space-y-2">
              <div className="flex gap-5 flex-wrap items-center basis-[400px]">
                <LabelValue label="Name" value={`${user.data.firstName} ${user.data.middleName ?? ""} ${user.data.lastName} ${user.data.suffix ?? ""}`} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Age" value={`${user.data.dob ? differenceInCalendarYears(new Date(), user.data.dob) : "0"} yr old`} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Gender" value={user?.data.gender} />
              </div>
              <Separator />
              <div className="flex gap-5 flex-wrap items-center basis-[400px]">
                <LabelValue label="Roles" value={roles?.length ?? 0} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Total Appointments" value={appointments?.data?.length ?? 0} />
              </div>
              <Separator />
              <LabelValue label="Joined" value={dayjs(user?.data.createdAt).fromNow()} />
            </div>
          </div>
        </CardContent>
      </Card>
      <ClinicMemberTabSection clinicUid={clinicUid} userId={userId}/>
    </>
  );
}

