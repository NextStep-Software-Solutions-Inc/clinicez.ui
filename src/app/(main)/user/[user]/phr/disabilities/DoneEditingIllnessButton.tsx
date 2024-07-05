"use client";

import { upsertUserIllnessAction } from "@actions/user-illness.action";
import { useUser } from "@auth0/nextjs-auth0/client";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { Illness } from "./IllnessItem";
import { useForm } from "react-hook-form";

interface DoneEditingIllnessButtonProps {
    onUpdate: (index: number, illness: Illness) => void;
    form: ReturnType<typeof useForm<Illness>>;
    index: number;
  }
export default function DoneEditingIllnessButton({index, form, onUpdate}:DoneEditingIllnessButtonProps) {
  
  const user = useUser();
  const userId = user?.user?.sub;
  
  const handleDoneEditing = async () => {
    form.handleSubmit((data) => {
      if(!userId) return toast.error("User not found");
      toast.promise(upsertUserIllnessAction({...data, userId,}), {
        loading: "Saving...",
        success: (res) =>{
          onUpdate(index, {...data, id: res.id});
          return "Illness updated successfully";
        },
        error: "Failed to update illness, Check if duplicate entry"
      })
    })()
  }
  return (
    <form action={handleDoneEditing}>
      <ActionButton size="sm" variant="ghost">Done Editing</ActionButton>
    </form>
  )
}
  