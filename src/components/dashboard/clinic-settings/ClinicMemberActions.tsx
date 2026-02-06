import {
  Info,
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react"
  
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GetClinicMembers, removeClinicMemberAction, updateClinicMemberRoleAction } from "@/actions/clinics/clinic-member.action"
import { toast } from "sonner"
import { promiseWrapper } from "@/lib/with-error-handling"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ActionButton from "@/components/ActionButton"
import { useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClinicRoles } from "@/hooks/useClinicRole"
import Each from "@/components/utils/Each"

interface ClinicMemberActionsProps {
  clinicMember: NonNullable<GetClinicMembers["data"]>[number]
  onUpdated?: () => void
}
export default function ClinicMemberActions({clinicMember, onUpdated: mutate}: ClinicMemberActionsProps) {

  const [openChangeRole, setOpenChangeRole] = useState(false)
  const [openRemoveMember, setOpenRemoveMember] = useState(false)

  const handleOpenDialog = (dialog: "changeRole" | "removeMember") => {
    switch (dialog) {
    case "changeRole":
      setOpenChangeRole(true)
      break
    case "removeMember":
      setOpenRemoveMember(true)
      break
    default:
      break
    }
  }

  const onCloseDialog = (state: boolean) => {
    if(!state) {
      setOpenChangeRole(false)
      setOpenRemoveMember(false)
    }
  }

  const isOwner = clinicMember.Role?.name === "owner"
  
  return (
    <Dialog open={openChangeRole|| openRemoveMember} onOpenChange={onCloseDialog}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon"><MoreHorizontal size={16}/></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {!isOwner && (
              <DropdownMenuItem 
                onClick={() => handleOpenDialog("changeRole")}
              >
                <Pencil className="mr-1 w-4 h-4"/>
                <span>Change Role</span>
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem 
                onClick={() => handleOpenDialog("removeMember")}
                className="text-destructive"
              >
                <Trash className="mr-1 w-4 h-4"/>
                <span>Remove</span>
              </DropdownMenuItem>
            )}
            {isOwner && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Owner role cannot be modified
              </div>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {openRemoveMember && <RemoveMemberContent clinicMember={clinicMember} onUpdated={mutate}/>}
      {openChangeRole && <ChangeRoleContent clinicMember={clinicMember} onUpdated={mutate}/>}

    </Dialog>
  )
}

interface ChangeRoleContentProps {
  clinicMember: NonNullable<GetClinicMembers["data"]>[number]
  onUpdated?: () => void
}
export const ChangeRoleContent = ({onUpdated, clinicMember}: ChangeRoleContentProps) => {
  const {data: clinicRoles} = useClinicRoles({})
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const handleUpdateRole = async (form: FormData) => {
    const roleId = Number(form.get("role"))
    toast.promise(promiseWrapper(updateClinicMemberRoleAction)(clinicMember.id, roleId), {
      loading: "Updating role...",
      success: res => {
        onUpdated?.()
        closeBtnRef.current?.click()
        return res.message
      },
      error: err => err
    })
  }

  return (
    
    <DialogContent className="max-w-lg">
      <form action={handleUpdateRole}>
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Update the role for this clinic member. Role-based permissions will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>What happens when you change the role:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>New role permissions will be applied</li>
                <li>Custom permissions granted manually will be preserved</li>
                <li>Old role-specific permissions will be removed</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select defaultValue={clinicMember.roleId?.toString()} name="role">
              <SelectTrigger className="w-[180px]">
                <SelectValue id="role" placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Roles</SelectLabel>
                  <Each
                    of={clinicRoles ?? []}
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
          <DialogClose ref={closeBtnRef}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <ActionButton type="submit">Confirm</ActionButton>
        </DialogFooter>
      </form>  
    </DialogContent>
  )
}

interface RemoveMemberContentProps {
  clinicMember: NonNullable<GetClinicMembers["data"]>[number]
  onUpdated?: () => void
}
export const RemoveMemberContent = ({clinicMember, onUpdated}: RemoveMemberContentProps) => {

  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const handleRemoveMember = () => {
    toast.promise(promiseWrapper(removeClinicMemberAction)(clinicMember.id), {
      loading: "Removing clinic member...",
      success: res => {
        onUpdated?.()
        closeBtnRef.current?.click()
        return res.message
      },
      error: err => err
    })
  }

  return (
    <DialogContent >
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Are you sure you want to permanently remove this member?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose ref={closeBtnRef}>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <form action={handleRemoveMember}>
          <ActionButton type="submit" variant="destructive">Confirm</ActionButton>
        </form>
      </DialogFooter>
    </DialogContent>
  )
}
  