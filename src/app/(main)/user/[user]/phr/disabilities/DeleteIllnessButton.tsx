"use client";

import { deleteUserIllnessAction } from "@actions/user-illness.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

interface DeleteIllnessButtonProps {
  remove: (index: number) => void;
  index: number;
  illnessId: number;
}
export default function DeleteIllnessButton({remove, index, illnessId}:DeleteIllnessButtonProps) {

  const action = async () => {
    if(illnessId === 0) return remove(index);
    toast.promise(deleteUserIllnessAction(illnessId), {
      loading: "Deleting...",
      success: () => {
        remove(index);
        return "Illness deleted successfully";
      },
      error: "Failed to delete illness"
    })
  }
  return (
    <form action={action}>
      <ActionButton size="sm" variant="destructive">Delete</ActionButton>
    </form>
  )
}