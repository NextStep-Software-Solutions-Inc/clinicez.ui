"use client";

import { updateFolderAction } from "@actions/folder.action";
import { useUser } from "@clerk/nextjs";
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

interface UpdateFolderModalProps {
  folderId: number;
  folderName: string;
}


export default function UpdateFolderModal({folderId, folderName}:UpdateFolderModalProps) {
  const { user } = useUser()
  const userId = user?.id

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    if(!userId) throw new Error("User ID is required to updat a folder.")
    const name = formData.get("name") as string
    toast.promise(updateFolderAction(folderId, name), {
      loading: "Updating folder...",
      success: (res) => {
        closeBtnRef.current?.click()
        return "Folder updated successfully"
      },
      error: "Failed to update folder"
    })
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="w-5 h-5 text-gray-400 invisible group-hover/folder:visible transition-all">
                <Pencil className="w-5 h-5 text-gray-500"/>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Update Folder</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Edit Folder Name" 
        description="Please fill in the fields below to update the folder name."
      >
        <form 
          action={action}
          id="folder-form"
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-baseline gap-4">
            <Label htmlFor="folder" className="text-right">
              Folder Name
            </Label>
            <Input
              id="folder"
              name="name"
              defaultValue={folderName}
              placeholder="Enter folder name"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton form="folder-form" type="submit">
              Save Changes
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
}
