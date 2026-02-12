"use client";

import React from "react";
import { Picture } from "@components/phr/Picture";
import { useUser } from "@hooks/useUser";
import { notFound } from "next/navigation";
import { LabelValue } from "@components/LabelValue";
import { Card, CardContent } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import dayjs from "@lib/day-utils";
import OrgMemberTabSection from "./OrgMemberTabSection";
import { useOrgMembers } from "@/hooks/useOrgMember";
import { calculateAge } from "@/lib/utils";

interface OrgMemberDetailsProps {
  userId: string;
  orgUid: string;
}
export default function OrgMemberDetails({userId, orgUid}:OrgMemberDetailsProps) {
  const {data: user, isLoading} = useUser({ userId });
  const {data: userOrgMemberships} = useOrgMembers({userId, orgUid});
  
  if(isLoading) return <div>Loading user...</div>
  if(!user?.data) notFound()

  const age = calculateAge(user.data.dob);

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
                <LabelValue label="Age" value={age ? `${age} yr old` : ""} />
                <Separator orientation="vertical" className="h-6"/>
                <LabelValue label="Gender" value={user?.data.gender} />
              </div>
              <Separator />
              <div className="flex gap-5 flex-wrap items-center basis-[400px]">
                <LabelValue label="Roles" value={userOrgMemberships?.data?.data?.length ?? 0} />
              </div>
              <Separator />
              <LabelValue label="Joined" value={dayjs(user?.data.createdAt).fromNow()} />
            </div>
          </div>
        </CardContent>
      </Card>
      <OrgMemberTabSection orgUid={orgUid} userId={userId}/>
    </>
  );
}

