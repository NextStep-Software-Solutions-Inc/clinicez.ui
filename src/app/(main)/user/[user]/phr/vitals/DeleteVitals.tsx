"use client";

import { revalidatePath } from "@actions/cache.action";
import { deleteUserVitalSignAction } from "@actions/vitals.action";
import ActionButton from "@components/ActionButton";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export const DeleteVitals = ({ id }: { id: number; }) => {
  const pathname = usePathname()

  const action = async () => {
    toast.promise(deleteUserVitalSignAction(id), {
      loading: "Deleting...",
      success: () => {
        revalidatePath(pathname, "page");
        return "Vitals deleted successfully"
      },
      error: "Failed to delete vitals"
    });
  }
  return (
    <form action={action} className="flex-grow sm:flex-grow-0">
      <ActionButton className="w-full" variant="destructive">Delete</ActionButton>
    </form>
  );
};
