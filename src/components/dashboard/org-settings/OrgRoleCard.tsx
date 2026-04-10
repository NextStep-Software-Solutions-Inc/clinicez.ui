"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@components/ui/card"
import { Separator } from "@components/ui/separator"
import { deleteClinicRoleAction, GetClinicRoles } from "@/actions/clinics/clinic-role.action"
import OrgRoleInitialPermissions from "./OrgRoleInitialPermissions";
import OrgRoleRequirements from "./OrgRoleRequirements";
import { toast } from "sonner";
import ActionButton from "@components/ActionButton";
import { Trash } from "lucide-react";
import { GetOrganizationRoles, deleteOrganizationRoleAction } from "@/actions/organizations/organization-role.action";
import { promiseWrapper } from "@/lib/with-error-handling";
import { parseRequirementSettings } from "@/lib/requirement-types";

interface OrgRoleCardProps {
    role: NonNullable<GetOrganizationRoles["data"]>[number]
    onDeleteRole?: () => void
  }
export const OrgRoleCard = ({role, onDeleteRole}:OrgRoleCardProps) => {
  const activeRoleRequirements = role.requirements
  const handleDelete = async () => {
    toast.promise(promiseWrapper(deleteOrganizationRoleAction)(role.id), {
      loading: "Deleting organization role...",
      success: res => {
        onDeleteRole?.();
        return res.message
      }, 
      error: error => error
    })
  }
 
  return (
    <Card className="group/action">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex-1 capitalize">{role.name}</span>
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
          currentRequirementSettings={parseRequirementSettings(role.requirementSettings)}
        />
        <Separator/>
        <OrgRoleInitialPermissions orgRoleId={role.id} />
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  )
}