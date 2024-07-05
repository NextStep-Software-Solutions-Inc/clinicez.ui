"use client";

import { useForm } from "react-hook-form";
import { Allergy } from "./EditAllergyForm";
import { useUser } from "@auth0/nextjs-auth0/client";
import { upsertUserAllergyAction } from "@actions/user-allergy.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

interface DoneEditingButtonProps {
    index: number
    update: (index: number, value: Allergy) => void
    form: ReturnType<typeof useForm<Allergy>>
}

export default function DoneEditingButton({index, update, form}: DoneEditingButtonProps) {
  
  const user = useUser();
  const userId = user.user?.sub;
  
  const action = async () => {
    form.handleSubmit((data) => {
      if(!userId) throw new Error("User ID is required to update allergy.")
      toast.promise(upsertUserAllergyAction({...data, userId}), {
        loading: "Saving...",
        success: (res) => {
          update(index, {
            ...data,
            id: res.id
          })
          form.reset(res);
          return "Allergy updated successfully."
        },
        error:`Failed to update allergy, Check if duplicate entry`
      })
    })();
  }
  
  return (
    <form action={action}>
      <ActionButton size="sm" variant="ghost">Done Editing</ActionButton>
    </form>
  )
}