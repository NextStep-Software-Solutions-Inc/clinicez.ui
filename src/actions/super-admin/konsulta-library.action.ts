"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { refreshPhilHealthKonsultaReferenceLibrary } from "@/lib/konsulta-library-persistence";
import { isSuperAdminAction } from "./admin-check.action";

type ActionResult<T> = {
  status: boolean;
  message: string;
  data: T | null;
};

export async function refreshKonsultaPhilHealthReferencesAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof refreshPhilHealthKonsultaReferenceLibrary>>>
> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) {
      throw new Error("Super admin privileges required.");
    }

    const result = await refreshPhilHealthKonsultaReferenceLibrary();
    revalidatePath("/super-admin/konsulta-libraries");

    return {
      status: true,
      message: "PhilHealth Konsulta references refreshed.",
      data: result,
    };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to refresh PhilHealth Konsulta references.",
      data: null,
    };
  }
}
