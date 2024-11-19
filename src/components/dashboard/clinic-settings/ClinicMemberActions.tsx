import {
  MoreHorizontal,
  Pencil,
  Trash,
} from "lucide-react"
  
import { Button } from "@/components/ui/button"
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
            <DropdownMenuItem 
              onClick={() => handleOpenDialog("changeRole")}
            >
              <Pencil className="mr-1 w-4 h-4"/>
              <span>Change Role</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleOpenDialog("removeMember")}
              className="text-destructive"
            >
              <Trash className="mr-1 w-4 h-4"/>
              <span>Remove</span>
            </DropdownMenuItem>
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

  const handleUpdateRole = async (form: FormData) => {
    const roleId = Number(form.get("role"))
    toast.promise(promiseWrapper(updateClinicMemberRoleAction)(clinicMember.id, roleId), {
      loading: "Updating role...",
      success: res => {
        onUpdated?.()
        return res.message
      },
      error: err => err
    })
  }

  return (
    
    <DialogContent >
      <form action={handleUpdateRole}>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure to change role?</DialogTitle>
          <DialogDescription>
          This action cannot be undone. Are you sure you want to permanently change role of this member?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select defaultValue={clinicMember.roleId?.toString()}>
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
  