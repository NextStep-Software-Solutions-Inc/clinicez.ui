"use client";

import { promiseWrapper } from "@/lib/with-error-handling";
import { createFolderAction } from "@actions/folder.action";
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
import { FolderIcon } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner";


interface CreateFolderModalProps {
  disabled?: boolean;
  clinicUid?: string;
  onCreated?: () => void;
}
export default function CreateFolderModal({disabled = false, clinicUid, onCreated}: CreateFolderModalProps) {
  const { user } = useUser()
  const userId = user?.id

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    if(!userId) throw new Error("User ID is required to create a folder.")
    const name = formData.get("name") as string
    toast.promise(promiseWrapper(createFolderAction)({name, userId, clinicUid}), {
      loading: "Creating folder...",
      success: async (res) => {
        if(res.status) {
          closeBtnRef.current?.click()
          onCreated?.()
        }
        return res.message
      },
      error: (error) => {
        return error
      }
    })
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button disabled={disabled} variant="default" size="sm" className="ml-auto group-hover/create-folder:visible transition-all"><FolderIcon className="h-4 w-4 mr-2"/> Create Folder</Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Create Folder</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <CustomModalContent 
        className="sm:max-w-[525px]"
        label="Create a Folder" 
        description="The folder will be created in the root directory. Please fill in the fields below to create a new folder."
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
              placeholder="Enter folder name"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <input ref={closeBtnRef} type="hidden"  value="ok"/>
            </DialogClose>
            <ActionButton form="folder-form" type="submit">
              Create
            </ActionButton>
          </DialogFooter>
        </form>
      </CustomModalContent>
    </Dialog>
  )
}
