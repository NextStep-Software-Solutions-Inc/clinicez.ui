"use client";

import { createFolderAction } from "@actions/file.actions";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip"
import { FolderIcon } from "lucide-react"
import { useRef } from "react"
import { toast } from "sonner";


export default function CreateFolderModal({disabled = false}: {disabled?: boolean}) {

  const closeBtnRef = useRef<HTMLInputElement>(null)
  const action = async (formData: FormData) => {
    const res = await createFolderAction(formData)
    if (res) {
      toast.success("Folder created successfully.")
      closeBtnRef.current?.click()
    }
  }

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button disabled={disabled} variant="default" size="sm" className="ml-auto invisible group-hover/upload:visible transition-all"><FolderIcon className="h-4 w-4 mr-2"/> Create Folder</Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Create Folder</TooltipContent>
      </Tooltip>
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
