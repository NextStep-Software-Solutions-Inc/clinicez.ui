import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@/actions/super-admin/admin-check.action";
import type { RVSProcedureType } from "@/actions/super-admin/import-medical-codes.action";

/**
 * POST /api/super-admin/import/rvs/finalize
 * Body: { type: RVSProcedureType; importedNames: string[] }
 * Returns: { deactivated: number }
 *
 * Deactivates master procedures NOT in the imported set for the given type.
 * Called from the upload Web Worker after all RVS batches for a type complete.
 */
export async function POST(req: NextRequest) {
  try {
    const ok = await isSuperAdminAction();
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      type: RVSProcedureType;
      importedNames: string[];
    };
    const { type, importedNames } = body;

    const validTypes: RVSProcedureType[] = [
      "imaging",
      "laboratory",
      "heart_station",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid procedure type: ${type}` },
        { status: 400 }
      );
    }

    const names = (Array.isArray(importedNames) ? importedNames : [])
      .map((n) => n.trim())
      .filter(Boolean);

    let count = 0;

    if (type === "imaging") {
      const result = await prisma.imagingProcedure.updateMany({
        where: { name: { notIn: names }, isActive: true },
        data: { isActive: false },
      });
      count = result.count;
    } else if (type === "laboratory") {
      const result = await prisma.laboratoryProcedure.updateMany({
        where: { name: { notIn: names }, isActive: true },
        data: { isActive: false },
      });
      count = result.count;
    } else {
      const result = await prisma.heartStationProcedure.updateMany({
        where: { name: { notIn: names }, isActive: true },
        data: { isActive: false },
      });
      count = result.count;
    }

    return NextResponse.json({ deactivated: count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
