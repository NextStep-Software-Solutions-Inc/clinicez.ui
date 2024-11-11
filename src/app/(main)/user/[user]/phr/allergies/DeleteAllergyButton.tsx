"use client";

import { deleteUserAllergyAction } from "@actions/users/user-allergy.action";
import ActionButton from "@components/ActionButton"
import { toast } from "sonner"

interface DeleteAllergyButtonProps {
    remove: (index: number) => void, 
    index: number, 
    id: number
}

export default function DeleteAllergyButton({remove, index, id}: DeleteAllergyButtonProps){

  const action = async () => {
    if (id === 0) remove(index) 
    else toast.promise(deleteUserAllergyAction(id), {
      loading: "Deleting...",
      success: () => {
        remove(index);
        return "Allergy deleted successfully."
      },
      error: "Failed to delete allergy."
    })
  }
  
  return (
    <form action={action} className="w-full">
      <ActionButton className="w-full" size="sm" variant="destructive">Delete</ActionButton>
    </form>
  )
}