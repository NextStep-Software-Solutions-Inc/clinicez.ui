import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@/actions/super-admin/admin-check.action";
import type { ICD10Row } from "@/actions/super-admin/import-medical-codes.action";

/**
 * POST /api/super-admin/import/icd10
 * Body: { rows: ICD10Row[] }
 * Returns: { upserted: number; errors: string[] }
 *
 * Called from the upload Web Worker — allows the batch upload loop to run
 * entirely off the main thread so the UI stays fully responsive.
 */
export async function POST(req: NextRequest) {
  try {
    const ok = await isSuperAdminAction();
    if (!ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { rows: ICD10Row[] };
    const rows: ICD10Row[] = Array.isArray(body?.rows) ? body.rows : [];

    const errors: string[] = [];
    let upserted = 0;

    for (const row of rows) {
      const code = row.code?.trim().toUpperCase();
      const displayDescription =
        row.shortDescription?.trim() || row.description?.trim();

      if (!code || !displayDescription) {
        errors.push(`Skipped row – missing code or description`);
        continue;
      }

      const upsertData = {
        description: displayDescription,
        shortDescription: row.shortDescription?.trim() || null,
        longDescription: row.longDescription?.trim() || null,
        hippaCovered: row.hippaCovered ?? false,
        orderNum: row.orderNum ?? null,
        category: row.category?.trim() || null,
        isActive: true,
      };

      try {
        await prisma.iCD10Code.upsert({
          where: { code },
          update: upsertData,
          create: { code, ...upsertData },
        });
        upserted++;
      } catch (err) {
        errors.push(
          `Failed to upsert ${code}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return NextResponse.json({ upserted, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
