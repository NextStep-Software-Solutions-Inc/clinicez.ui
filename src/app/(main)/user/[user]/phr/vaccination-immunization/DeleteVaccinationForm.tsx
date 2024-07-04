"use client";

import React from "react";
import ActionButton from "@components/ActionButton";
import { toast } from "sonner";
import { deleteUserVaccinationAction } from "@actions/user-vaccination.action";
import { revalidatePath } from "@actions/cache.action";

export const DeleteVaccinationForm = ({ vaccinationId }: { vaccinationId: number; }) => {

  const deleteVaccination = async () => {
    toast.promise(deleteUserVaccinationAction(vaccinationId), {
      loading: "Deleting vaccination...",
      success: () => {
        revalidatePath(`/user/[user]/phr/vaccination-immunization`, "page");
        return "Vaccination deleted successfully";
      },
      error: "Failed to delete vaccination"
    });
  };

  return (
    <form action={deleteVaccination}>
      <ActionButton size="sm" variant="destructive">Delete</ActionButton>
    </form>
  );
};
