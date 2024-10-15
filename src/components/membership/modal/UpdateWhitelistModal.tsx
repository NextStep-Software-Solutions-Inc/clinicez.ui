"use client";

import { updateWhitelistAction } from "@actions/users/user-appointment-whitelist";
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
import { Pencil } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner";

interface UpdateWhitelistFilterModalProps {
  whitelistId: number;
  name: string;
  onUpdated?: () => void;
}

export default function UpdateWhitelistFilterModal({whitelistId, name, onUpdated}:UpdateWhitelistFilterModalProps) {

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const name = formData.get("name") as string
    toast.promise(updateWhitelistAction({ id: whitelistId, name }), {
      loading: "Updating whitelist...",
      success: (res) => {
        if(res.status){
          closeBtnRef.current?.click()
          onUpdated?.()
        }
        return res.message
      },
      error: "Failed to update whitelist"
    })
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="w-5 h-5 text-gray-400 invisible group-hover/whitelist:visible transition-all">
                <Pencil className="w-5 h-5 text-gray-500"/>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Update Whitelist Name</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Edit Whitelist Name" 
        description="Update the name of this whitelist."
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
              defaultValue={name}
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
