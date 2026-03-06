import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@/actions/super-admin/admin-check.action";

/**
 * POST /api/super-admin/import/icd10/finalize
 * Body: { importedCodes: string[] }
 * Returns: { deactivated: number }
 *
 * Deactivates all ICD-10 codes that were NOT included in the current import run.
 * Called from the upload Web Worker after all batches complete.
 */
export async function POST(req: NextRequest) {
  try {
    const ok = await isSuperAdminAction();
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { importedCodes: string[] };
    const importedCodes: string[] = Array.isArray(body?.importedCodes)
      ? body.importedCodes
      : [];

    const upperCodes = importedCodes.map((c) => c.toUpperCase());

    const result = await prisma.iCD10Code.updateMany({
      where: {
        code: { notIn: upperCodes },
        isActive: true,
      },
      data: { isActive: false },
    });

    return NextResponse.json({ deactivated: result.count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
