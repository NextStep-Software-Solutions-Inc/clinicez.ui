"use client";

import { upsertUserDisabilityAction } from "@actions/user-disability.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { Disability } from "./DisabilityItem";
import { useForm } from "react-hook-form";

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
      toast.promise(upsertUserDisabilityAction({...data, userId,}), {
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
  