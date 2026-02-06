"use client";

import Each from "@/components/utils/Each";
import dayjs from "@lib/day-utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ClinicMemberActions from "./ClinicMemberActions";
import { useClinicMembers } from "@/hooks/useClinicMember";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { BadgeCheck, User } from "lucide-react";
import { GetClinicMembers } from "@/actions/clinics/clinic-member.action";
import { cn } from "@/lib/utils";
import { AddClinicMemberDialog } from "./AddClinicMemberDialog";

export default function ClinicMembershipSettings() {
  
  const {clinicUid} = useParams<{clinicUid: string}>()
  const {data: clinicMembers, mutate} = useClinicMembers({clinicUid})
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>Membership</CardTitle>
          <CardDescription>
          Manage membership for your clinic.
          </CardDescription>
        </div>
        <AddClinicMemberDialog onAdded={mutate}/>
      </CardHeader>
      <CardContent>
        <MembersList clinicMembers={clinicMembers?.data ?? []} onUpdated={mutate}/>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}


interface MembersListProps {
  clinicMembers: NonNullable<GetClinicMembers["data"]>
  onUpdated?: () => void
}

export const MembersList = ({clinicMembers, onUpdated}: MembersListProps) => {

  return (
    <div className="">
      <Each
        of={clinicMembers ?? []}
        render={(clinicMember) => {
          const { User: { firstName, middleName, lastName, suffix, picture}, Role, status, createdAt} = clinicMember
          return (
            <div className="flex items-center hover:bg-slate-50 p-1 rounded transition-all">
              <div className="flex items-center space-x-4 flex-1">
                <Avatar>
                  {
                    picture 
                      ? <Image src={picture} width={40} height={40} className="object-cover" alt="user-picture"/>
                      : <AvatarFallback>{firstName?.charAt(0)}{firstName?.charAt(0)} </AvatarFallback> 
                  }
                </Avatar>
                <div className="">
                  <p className="text-sm font-medium">{firstName} {middleName} {lastName} {suffix}</p>
                  <p className="text-xs text-muted-foreground">Joined {dayjs(createdAt).fromNow()}</p>
                </div>
              </div>
              <div className=" space-y-1 flex-1">
                <div className={
                  cn("text-sm flex gap-1 items-center ",{"text-cyan-500": Role?.name === "owner"})
                }>
                  <User size={16}/><span >{Role?.name}</span>
                </div>
                <div className={
                  cn("text-sm flex gap-1 items-center lowercase",{"text-teal-500": status.toLocaleLowerCase() === "active"})
                }>
                  <BadgeCheck size={16}/>{status}
                </div>
              </div>
              <div className="">
                <ClinicMemberActions
                  onUpdated={onUpdated}
                  clinicMember={clinicMember}/>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}