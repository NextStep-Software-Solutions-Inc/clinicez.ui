"use client";

import { deleteUserDisabilityAction } from "@actions/user-disability.action";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";

interface DeleteDisabilityButtonProps {
  remove: (index: number) => void;
  index: number;
  disabilityId: number;
}
export default function DeleteDisabilityButton({remove, index, disabilityId}:DeleteDisabilityButtonProps) {

  const action = async () => {
    if(disabilityId === 0) return remove(index);
    toast.promise(deleteUserDisabilityAction(disabilityId), {
      loading: "Deleting...",
      success: () => {
        remove(index);
        return "Disability deleted successfully";
      },
      error: "Failed to delete disability"
    })
  }
  return (
    <form action={action}>
      <ActionButton size="sm" variant="destructive">Delete</ActionButton>
    </form>
  )
}