"use client";

import { upsertUserDisabilityAction } from "@actions/user-disability.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Disability } from "./DisabilityList";

interface DoneEditingDisabilityButtonProps {
    onUpdate: (index: number, disability: Disability) => void;
    form: ReturnType<typeof useForm<Disability>>;
    index: number;
  }
export default function DoneEditingDisabilityButton({index, form, onUpdate}:DoneEditingDisabilityButtonProps) {
  
  const user = useUser();
  const userId = user?.user?.sub;
  
  const handleDoneEditing = async () => {
    form.handleSubmit((data) => {
      if(!userId) return toast.error("User not found");
      toast.promise(upsertUserDisabilityAction({
        id: data.id,
        userId,
        disability: data.Disability.name.trim(),
        severity: data.severity,
        notes: data.notes,
        ...data.dateDiagnosed ? {dateDiagnosed: data.dateDiagnosed} : {},
        ...data.isManaged ? {isManaged: data.isManaged} : {},
      }), {
        loading: "Saving...",
        success: (res) =>{
          onUpdate(index, {...data, id: res.id});
          return "Disability updated successfully";
        },
        error: "Failed to update disability, Check if duplicate entry"
      })
    })()
  }
  
  return (
    <form action={handleDoneEditing}>
      <ActionButton size="sm" variant="ghost">Done Editing</ActionButton>
    </form>
  )
}
  