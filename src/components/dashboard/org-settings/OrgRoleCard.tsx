"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card"
import { Separator } from "@components/ui/separator"
import { deleteClinicRoleAction, GetClinicRoles } from "@/actions/clinics/clinic-role.action"
import OrgRoleInitialPermissions from "./OrgRoleInitialPermissions";
import OrgRoleRequirements from "./OrgRoleRequirements";
import { toast } from "sonner";
import ActionButton from "@components/ActionButton";
import { Trash } from "lucide-react";
import { GetOrganizationRoles } from "@/actions/organizations/organization-role.action";

interface OrgRoleCardProps {
    role: NonNullable<GetOrganizationRoles>[number]
    onDeleteRole?: () => void
  }
export const OrgRoleCard = ({role, onDeleteRole}:OrgRoleCardProps) => {
  const activeRoleRequirements = role.UserDefaultOrganizationRoles.flatMap((item) => item.OrganizationRole.requirements)
  const handleDelete = async () => {
    toast.promise(deleteClinicRoleAction(role.id), {
      loading: "Deleting role...",
      success: res => {
        if(res.status) {
          onDeleteRole?.();
        }
        return res.message
      }
    })
  }
 
  return (
    <Card className="group/action">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex-1">{role.name}</span>
            <form action={handleDelete} className="invisible group-hover/action:visible transition-all">
              <ActionButton variant="destructive" type="submit">
                <Trash size={16} className="mr-2"/>
                Delete Role
              </ActionButton>
            </form>
          </div>
        </CardTitle>
        <CardDescription>
          {role.description ?? "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <OrgRoleRequirements 
          orgRoleId={role.id}
          currentRequirements={activeRoleRequirements}
        />
        <Separator/>
        <OrgRoleInitialPermissions orgRoleId={role.id} />
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  )
}