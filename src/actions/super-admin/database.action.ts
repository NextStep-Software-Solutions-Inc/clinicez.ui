"use server";

import prisma from "@/lib/prisma";
import { isSuperAdminAction } from "./admin-check.action";

export async function discoverDatabaseSequencesAction() {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized: Only super admins can access this resource");

    const result = await prisma.$queryRaw<Array<{ sequence_name: string; table_name: string }>>`
      SELECT c.relname as table_name, s.relname as sequence_name
      FROM pg_class s
      JOIN pg_depend d ON d.objid = s.oid
      JOIN pg_class c ON d.refobjid = c.oid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
      WHERE s.relkind = 'S' AND a.attname = 'id';
    `;

    return { status: true, data: result };
  } catch (error: any) {
    console.error("[discoverDatabaseSequencesAction]", error);
    return { status: false, message: error.message || "Failed to discover sequences" };
  }
}

export async function fixSingleSequenceAction(sequenceName: string, tableName: string) {
  try {
    const isSuperAdmin = await isSuperAdminAction();
    if (!isSuperAdmin) throw new Error("Unauthorized");

    await prisma.$executeRawUnsafe(
      `SELECT setval('"${sequenceName}"', coalesce((SELECT MAX(id)+1 FROM "${tableName}"), 1), false);`
    );
    return { status: true, message: `Synced sequence '${sequenceName}' for table '${tableName}'` };
  } catch (error: any) {
    return { status: false, message: `Failed for table '${tableName}': ${error.message}` };
  }
}
