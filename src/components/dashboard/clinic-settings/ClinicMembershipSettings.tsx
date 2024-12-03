"use client";

import Each from "@/components/utils/Each";
import dayjs from "@lib/day-utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card";
import ClinicMemberActions from "./ClinicMemberActions";
import { useClinicMembers } from "@/hooks/useClinicMember";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cva } from "class-variance-authority";
import { BadgeCheck, RollerCoaster, User } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useOrganizations } from "@/hooks/useOrganization";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { promiseWrapper } from "@/lib/with-error-handling";
import { GetClinicMembers, addClinicMemberAction } from "@/actions/clinics/clinic-member.action";
import { useClinicRoles } from "@/hooks/useClinicRole";
import { cn } from "@/lib/utils";

export default function ClinicMembershipSettings() {
  
  const {clinicUid} = useParams<{clinicUid: string}>()
  const {data: clinicMembers, mutate} = useClinicMembers(clinicUid)
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>Membership</CardTitle>
          <CardDescription>
          Manage membership for your clinic.
          </CardDescription>
        </div>
        <AddClinicMember onAdded={mutate}/>
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

interface AddClinicMemberProps {
  onAdded?: () => void
}

export const AddClinicMember = ({onAdded}: AddClinicMemberProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [selectedOrgUid, setSelectedOrgUid] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const {clinicUid} = useParams<{clinicUid: string}>()
  const {data: organizations } = useOrganizations({
    clinicUid
  })
  const {data} = useUsers({
    orgUid: selectedOrgUid ?? "undefined"
  })

  const {data: clinicRoles} = useClinicRoles({})
  const filteredRoles = useMemo(() => clinicRoles?.filter(r => !["owner", "patient"].includes(r.name.toLocaleLowerCase())), [clinicRoles])
  const users = data?.[0]
  const handleAddClinicMember = async () => {
    if(!selectedRoleId || !selectedUserId) {
      toast.error("Please select a user and a role to add as a member.")
      return;
    }
    toast.promise(promiseWrapper(addClinicMemberAction)({
      clinicUid,
      roleId: Number(selectedRoleId),
      userId: selectedUserId
    }), {
      loading: "Adding member...",
      success: res => {
        onAdded?.()
        closeButtonRef.current?.click()
        return res.message
      },
      error: err => err
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>
      <DialogContent >
        <form action={handleAddClinicMember}>
          <DialogHeader>
            <DialogTitle>Add Clinic Member</DialogTitle>
            <DialogDescription>
            Select a user within your partner organization to add as a member of this clinic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
              Organization
              </Label>
              <Select onValueChange={(value) => setSelectedOrgUid(value)}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue id="role" placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Organizations</SelectLabel>
                    <Each
                      of={organizations ?? []}
                      render={(organization) => (
                        <SelectItem key={organization.id} value={organization.orgUid}>{organization.name} ({organization.orgUid})</SelectItem>
                      )}
                    />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
              User
              </Label>
              <Select onValueChange={(value) => setSelectedUserId(value)}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue id="role" placeholder="Select a user within your partner organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>User</SelectLabel>
                    <Each
                      of={users ?? []}
                      render={(user) => (
                        <SelectItem className="font-medium" key={user.id} value={user.userId}>{user.firstName} {user.middleName} {user.lastName} {user.suffix}</SelectItem>
                      )}
                    />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
              Role
              </Label>
              <Select onValueChange={(value) => setSelectedRoleId(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue id="role" placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <Each
                      of={filteredRoles ?? []}
                      render={(role, index) => (
                        <SelectItem value={role.id.toString()}>{role.name}</SelectItem>
                      )}
                    />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose ref={closeButtonRef}>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <ActionButton type="submit">Add Member</ActionButton>
          </DialogFooter>
        </form>  
      </DialogContent>
    </Dialog>
  )
}