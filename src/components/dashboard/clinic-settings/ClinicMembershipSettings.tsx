"use client";

import Each from "@/components/utils/Each";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ClinicMemberActions from "./ClinicMemberActions";
import { useClinicMembers } from "@/hooks/useClinicMember";
import { useParams } from "next/navigation";

export default function ClinicMembershipSettings() {
  
  const {clinicUid} = useParams<{clinicUid: string}>()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership</CardTitle>
        <CardDescription>
          Manage membership for your clinic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MembersList clinicUid={clinicUid}/>

      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}


export const MembersList = ({clinicUid}: {clinicUid: string}) => {

  const {data: clinicMembers} = useClinicMembers(clinicUid)

  return (
    <div className="">
      <Each
        of={clinicMembers?.data ?? []}
        render={(clinicMember) => {
          const { User: { firstName, middleName, lastName, suffix}, Role} = clinicMember
          return (
            <div className="flex items-center justify-between hover:bg-slate-100 p-1 rounded transition-all">
              <div className="flex items-center space-x-4 ">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="font-medium">{firstName} {middleName} {lastName} {suffix}</div>
                  <div className="text-xs text-muted-foreground">
                    {Role?.name}
                  </div>
                </div>
              </div>
              <div>
                <ClinicMemberActions/>
              </div>
            </div>

          )
        }}
      />
    </div>
  )
}