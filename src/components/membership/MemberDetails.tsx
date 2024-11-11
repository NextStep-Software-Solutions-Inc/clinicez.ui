"use client";

import React from "react";
import { Picture } from "../../app/(main)/user/[user]/phr/Picture";
import { useUser as useDBUser } from "@hooks/useUser";
import { notFound } from "next/navigation";
import { LabelValue } from "@components/LabelValue";
import { differenceInCalendarYears } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { useOrgRoles } from "@hooks/useOrgRole";
import { useOrgAppointments } from "@hooks/useAppointment";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import MemberTabSection from "./MemberTabSection";
dayjs.extend(relativeTime);

interface MemberDetailsProps {
  userId: string;
  orgUid: string;
}
export default function MemberDetails({userId, orgUid}:MemberDetailsProps) {
  const {data: user, isLoading} = useDBUser({ userId, orgUid });
  
  const {data: roles} = useOrgRoles(orgUid,  {userId});
  const {data: appointments} = useOrgAppointments({orgUid, userId });
  
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
      <MemberTabSection orgUid={orgUid} userId={userId}/>
    </>
  );
}

