import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { isSuperAdminAction } from "@/actions/super-admin/admin-check.action";
import type {
  RVSProcedureType,
  RVSProcedureRow,
} from "@/actions/super-admin/import-medical-codes.action";

/**
 * POST /api/super-admin/import/rvs
 * Body: { type: RVSProcedureType; rows: RVSProcedureRow[] }
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

    const body = (await req.json()) as {
      type: RVSProcedureType;
      rows: RVSProcedureRow[];
    };
    const { type, rows } = body;

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

    const errors: string[] = [];
    let upserted = 0;

    for (const row of rows) {
      const name = row.name?.trim();
      const category = row.category?.trim();

      if (!name || !category) {
        errors.push(`Skipped row – missing name or category`);
        continue;
      }

      const data = {
        description: row.description?.trim() || null,
        rvsCode: row.rvsCode?.trim() || null,
        isActive: true,
      };

      try {
        if (type === "imaging") {
          await prisma.imagingProcedure.upsert({
            where: { unique_imaging_procedure: { name, category } },
            update: data,
            create: { name, category, ...data },
          });
        } else if (type === "laboratory") {
          await prisma.laboratoryProcedure.upsert({
            where: { unique_laboratory_procedure: { name, category } },
            update: data,
            create: { name, category, ...data },
          });
        } else {
          await prisma.heartStationProcedure.upsert({
            where: { unique_heart_station_procedure: { name, category } },
            update: data,
            create: { name, category, ...data },
          });
        }
        upserted++;
      } catch (err) {
        errors.push(
          `Failed to upsert ${name}: ${err instanceof Error ? err.message : String(err)}`
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
