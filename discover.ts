import { createPrismaClient } from './src/lib/factory/prisma';
import fs from 'fs';
import 'dotenv/config';

const prisma = createPrismaClient();

async function main() {
  const result: any[] = await prisma.$queryRaw`
    SELECT
        tc.table_name, kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY';
  `;
  
  // We need to resolve all dependencies starting from User and ClinicPatient.
  const targetTables = ['User', 'ClinicPatient'];
  
  // graph representation: table -> list of {table, column, foreign_column}
  const dependents: Record<string, {table: string, col: string, fCol: string}[]> = {};
  for (const row of result) {
    if (!dependents[row.foreign_table_name]) dependents[row.foreign_table_name] = [];
    dependents[row.foreign_table_name].push({
      table: row.table_name,
      col: row.column_name,
      fCol: row.foreign_column_name
    });
  }

  const ids = [11099, 11098, 11097, 11096, 11095, 11094, 11093, 11092, 11091, 11090, 
    11089, 11088, 11087, 11086, 11085, 11084, 11083, 11082, 11081, 11080, 
    11079, 11078, 11077, 11076, 11075, 11074, 11073, 11072, 11071, 11070, 
    11069, 11068, 11067, 11066, 11065, 11064, 11063, 11062, 11061, 11060, 
    11059, 11058, 11057, 11056, 11055, 11054, 11053, 11052, 11051, 11050, 
    11049, 11048, 11047, 11046, 11045, 11044, 11043, 11042, 11041, 11040, 
    11039, 11038, 11037, 11036, 11035, 11034, 11033, 11032, 11031, 11030, 
    11029, 11028, 11027, 11026, 11025, 11024, 11023, 11022, 11021, 11020, 
    11019, 11018, 11017, 11016, 11015, 11014, 11013, 11012, 11011, 11010, 
    11009, 11008, 11007, 11006, 11005, 11004, 11003, 11002, 11001, 11000];
  
  let sql = 'BEGIN;\n\n';

  // Helper to generate recursive CTEs for deletion of N-depth dependencies
  function buildRecursiveDelete(table: string, pathCondition: string, currentTableAlias: string): string[] {
    const stmts: string[] = [];
    const children = dependents[table] || [];
    for (const child of children) {
       // Avoid self-referencing loops if any
       if (child.table === table) continue;
       
       const nextPathCondition = `SELECT "id" FROM "${child.table}" WHERE "${child.col}" IN (${pathCondition})`;
       const childStmts = buildRecursiveDelete(child.table, nextPathCondition, child.table);
       stmts.push(...childStmts);
       
       // Add the actual delete statement for this child AFTER its own children are deleted
       stmts.push(`DELETE FROM "${child.table}" WHERE "${child.col}" IN (${pathCondition});`);
    }
    return stmts;
  }

  // ClinicPatient dependencies
  const cpDeletes = buildRecursiveDelete('ClinicPatient', `SELECT "id" FROM "ClinicPatient" WHERE "patientId" IN (${ids.join(', ')})`, 'ClinicPatient');
  
  // User dependencies
  const userDeletes = buildRecursiveDelete('User', `${ids.join(', ')}`, 'User');

  // We must ensure unique statements and ordered correctly. Since children are deleted before parents in `buildRecursiveDelete`, we just need to append them.
  // We'll deduplicate by exact string to avoid deleting same exact subset multiple times unnecessarily.
  const allStmts = [...new Set([...cpDeletes, ...userDeletes])];
  
  sql += allStmts.join('\n') + '\n\n';
  sql += `DELETE FROM "ClinicPatient" WHERE "patientId" IN (${ids.join(', ')});\n`;
  sql += `DELETE FROM "User" WHERE "id" IN (${ids.join(', ')});\n`;
  sql += '\nCOMMIT;\n';

  fs.writeFileSync('force-delete-users-generated.sql', sql);
  console.log('Script generated to force-delete-users-generated.sql');
}

main().catch(console.error).finally(() => prisma.$disconnect());
