"use client";

import { useForm } from "react-hook-form";
import { Allergy } from "./EditAllergyForm";
import { useUser } from "@clerk/nextjs";
import { upsertUserAllergyAction } from "@actions/users/user-allergy.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

interface DoneEditingButtonProps {
  index: number
  update: (index: number, value: Allergy) => void
  form: ReturnType<typeof useForm<Allergy>>
}

export default function DoneEditingButton({ index, update, form }: DoneEditingButtonProps) {

  const { user } = useUser();
  const userId = user?.id;

  const action = async () => {
    form.handleSubmit((data) => {
      if (!userId) throw new Error("User ID is required to update allergy.")
      toast.promise(upsertUserAllergyAction({ ...data, userId }), {
        loading: "Saving...",
        success: (res) => {
          update(index, {
            ...data,
            id: res.id
          })
          form.reset(res);
          return "Allergy updated successfully."
        },
        error: `Failed to update allergy, Check if duplicate entry`
      })
    })();
  }

  return (
    <form action={action}>
      <ActionButton size="sm" variant="ghost">Done Editing</ActionButton>
    </form>
  )
}