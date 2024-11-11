"use client";

import { createWhitelistAction } from "@actions/users/user-appointment-whitelist";
import ActionButton from "@components/ActionButton"
import CustomModalContent from "@components/CustomModalContent";
import { Button } from "@components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@components/ui/dialog"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip"
import { Plus } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner";

interface CreateWhitelistFilterModalProps {
  clinicUid: string;
  userId: string;
  onUpdated?: () => void;
}

export default function CreateWhitelistFilterModal({ onUpdated, clinicUid, userId}:CreateWhitelistFilterModalProps) {

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const name = formData.get("name") as string
    const decodedUserId = decodeURIComponent(userId)
    toast.promise(createWhitelistAction({ name, clinicUid, userId:decodedUserId }), {
      loading: "Creating whitelist...",
      success: (res) => {
        if(res.status){
          closeBtnRef.current?.click()
          onUpdated?.()
        }
        return res.message
      },
      error: "Failed to create whitelist"
    })
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-5 h-5 mr-1"/>
                Create Whitelist 
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Create Whitelist Name</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Create Whitelist Name" 
        description="Create a new whitelist filters."
      >
        <form 
          action={action}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="folder" className="text-right">
              Whitelist Name
            </Label>
            <Input
              id="folder"
              name="name"
              placeholder="Enter whitelist name"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton type="submit">
              Save Changes
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
}
