"use client";

import { upsertUserIllnessAction } from "@actions/users/user-illness.action";
import { useUser } from "@clerk/nextjs";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Illness } from "./IllnessList";
import { Severity } from "@/types";

interface DoneEditingIllnessButtonProps {
    onUpdate: (index: number, illness: Illness) => void;
    form: ReturnType<typeof useForm<Illness>>;
    index: number;
  }
export default function DoneEditingIllnessButton({index, form, onUpdate}:DoneEditingIllnessButtonProps) {
  
  const { user } = useUser();
  const userId = user?.id;
  
  const handleDoneEditing = async () => {
    form.handleSubmit((data) => {

      if(!userId) return toast.error("User not found");
      toast.promise(upsertUserIllnessAction({
        id: data.id,
        userId,
        illness: data.HealthCondition.name.trim(),
        severity: data.severity as Severity,
        notes: data.notes,
        ...(data.dateDiagnosed && {dateDiagnosed: data.dateDiagnosed})
      }), {
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
  