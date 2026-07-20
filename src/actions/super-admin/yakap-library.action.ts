"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getCachedSession } from "@/actions/session.action";
import { isSuperAdminAction } from "./admin-check.action";

type ActionResult<T> = {
  status: boolean;
  message: string;
  data: T | null;
};

export async function createYakapLibrary(data: {
  name: string;
  description?: string;
}): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const session = await getCachedSession();

    const newLibrary = await prisma.philHealthYakapLibrary.create({
      data: {
        name: data.name,
        description: data.description,
        columns: [], // initialized as empty, populated later
        isActive: true,
      },
    });



    revalidatePath("/super-admin/yakap-libraries");

    return { status: true, message: "Library created successfully.", data: newLibrary };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to create library.", data: null };
  }
}

export async function getYakapLibraries(): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const libraries = await prisma.philHealthYakapLibrary.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { Rows: true } }
      }
    });

    return { status: true, message: "Fetched libraries.", data: libraries };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to fetch libraries.", data: null };
  }
}

export async function getYakapLibraryById(id: string, page: number = 1, pageSize: number = 1000000): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const library = await prisma.philHealthYakapLibrary.findUnique({
      where: { id },
      include: {
        Rows: {
          orderBy: { createdAt: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        },
        _count: {
          select: { Rows: true }
        }
      },
    });

    if (!library) throw new Error("Library not found.");

    return { status: true, message: "Fetched library.", data: library };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to fetch library.", data: null };
  }
}

export async function updateYakapLibrary(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const session = await getCachedSession();

    const updated = await prisma.philHealthYakapLibrary.update({
      where: { id },
      data,
    });



    revalidatePath("/super-admin/yakap-libraries");
    revalidatePath(`/super-admin/yakap-libraries/${id}`);

    return { status: true, message: "Library updated successfully.", data: updated };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to update library.", data: null };
  }
}

export async function deleteYakapLibrary(id: string): Promise<ActionResult<boolean>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const session = await getCachedSession();

    await prisma.philHealthYakapLibrary.delete({ where: { id } });



    revalidatePath("/super-admin/yakap-libraries");

    return { status: true, message: "Library deleted successfully.", data: true };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to delete library.", data: null };
  }
}

export async function saveYakapLibraryData(
  libraryId: string,
  columns: string[],
  rowsData: Record<string, string>[]
): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const session = await getCachedSession();

    const updatedLibrary = await prisma.$transaction(async (tx) => {
      // Update columns
      const library = await tx.philHealthYakapLibrary.update({
        where: { id: libraryId },
        data: { columns },
      });

      // Clear existing rows (if replacing all data) or we can choose to merge.
      // Since it's an Excel upload, usually it replaces everything to maintain sync.
      await tx.philHealthYakapLibraryRow.deleteMany({
        where: { libraryId },
      });

      // Insert new rows
      if (rowsData.length > 0) {
        await tx.philHealthYakapLibraryRow.createMany({
          data: rowsData.map((data) => ({
            libraryId,
            data,
            isActive: true,
          })),
        });
      }

      return library;
    });



    revalidatePath(`/super-admin/yakap-libraries/${libraryId}`);
    revalidatePath("/super-admin/yakap-libraries");

    return { status: true, message: "Library data saved successfully.", data: updatedLibrary };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to save library data.", data: null };
  }
}

export async function updateYakapLibraryColumns(
  libraryId: string,
  columns: string[]
): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const updated = await prisma.philHealthYakapLibrary.update({
      where: { id: libraryId },
      data: { columns },
    });

    revalidatePath(`/super-admin/yakap-libraries/${libraryId}`);
    return { status: true, message: "Columns updated successfully.", data: updated };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to update columns.", data: null };
  }
}

export async function appendYakapLibraryRows(
  libraryId: string,
  rowsData: Record<string, string>[]
): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    if (rowsData.length > 0) {
      await prisma.philHealthYakapLibraryRow.createMany({
        data: rowsData.map((data) => ({
          libraryId,
          data,
          isActive: true,
        })),
      });
    }

    revalidatePath(`/super-admin/yakap-libraries/${libraryId}`);
    return { status: true, message: "Rows appended successfully.", data: null };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to append rows.", data: null };
  }
}

export async function updateYakapLibraryRow(
  rowId: string,
  data: Record<string, string>
): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const updatedRow = await prisma.philHealthYakapLibraryRow.update({
      where: { id: rowId },
      data: { data },
    });

    revalidatePath(`/super-admin/yakap-libraries/${updatedRow.libraryId}`);
    return { status: true, message: "Row updated successfully.", data: updatedRow };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to update row.", data: null };
  }
}

export async function deleteYakapLibraryRow(rowId: string): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const deletedRow = await prisma.philHealthYakapLibraryRow.delete({
      where: { id: rowId },
    });

    revalidatePath(`/super-admin/yakap-libraries/${deletedRow.libraryId}`);
    return { status: true, message: "Row deleted successfully.", data: null };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to delete row.", data: null };
  }
}

export async function batchDeleteYakapLibraryRows(rowIds: string[]): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    if (rowIds.length === 0) throw new Error("No rows selected for deletion.");

    // get libraryId for revalidation (assuming all rows belong to the same library in a single operation)
    const firstRow = await prisma.philHealthYakapLibraryRow.findUnique({ where: { id: rowIds[0] } });

    await prisma.philHealthYakapLibraryRow.deleteMany({
      where: { id: { in: rowIds } },
    });

    if (firstRow) {
      revalidatePath(`/super-admin/yakap-libraries/${firstRow.libraryId}`);
    }
    return { status: true, message: "Rows deleted successfully.", data: null };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to batch delete rows.", data: null };
  }
}

export async function resetYakapLibrary(libraryId: string): Promise<ActionResult<any>> {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Super admin privileges required.");

    const updatedLibrary = await prisma.$transaction(async (tx) => {
      await tx.philHealthYakapLibraryRow.deleteMany({
        where: { libraryId },
      });

      return await tx.philHealthYakapLibrary.update({
        where: { id: libraryId },
        data: { columns: [] },
      });
    });

    revalidatePath(`/super-admin/yakap-libraries/${libraryId}`);
    revalidatePath("/super-admin/yakap-libraries");
    
    return { status: true, message: "Library reset successfully.", data: updatedLibrary };
  } catch (error: any) {
    return { status: false, message: error.message || "Failed to reset library.", data: null };
  }
}

