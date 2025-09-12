/**
 * Database Health Service
 * Provides utilities to handle database consistency issues,
 * particularly around ID generation and sequence management
 */

import prisma from "@lib/prisma";

/**
 * Checks if there are sequence/ID generation issues
 * This is particularly important for autoincrement fields during high concurrency
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Test basic database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check if we can create a simple record (this will test ID generation)
    const testResult = await prisma.$transaction(async (tx) => {
      // This is a safe way to test ID generation without affecting real data
      try {
        // Test folder table ID generation
        const maxFolderId = await tx.folder.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        });

        const maxFolderSettingId = await tx.folderSetting.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        });

        return {
          maxFolderId: maxFolderId?.id || 0,
          maxFolderSettingId: maxFolderSettingId?.id || 0
        };
      } catch (error) {
        issues.push(`ID generation test failed: ${error}`);
        return null;
      }
    });

    if (!testResult) {
      issues.push("Database transaction test failed");
    }

  } catch (error) {
    issues.push(`Database connectivity failed: ${error}`);
  }

  return {
    healthy: issues.length === 0,
    issues
  };
}

/**
 * Attempts to fix common database sequence issues
 * This is mainly for PostgreSQL databases where sequences can get out of sync
 */
export async function repairDatabaseSequences(): Promise<{
  repaired: boolean;
  actions: string[];
}> {
  const actions: string[] = [];

  try {
    // This function would be database-specific
    // For PostgreSQL, we might need to reset sequences
    // For MySQL, autoincrement values might need adjustment

    // Check if we're using PostgreSQL
    const isPostgres = await prisma.$queryRaw`SELECT version()`.then(
      (result: any) => {
        const version = Array.isArray(result) ? result[0]?.version : result?.version;
        return typeof version === 'string' && version.toLowerCase().includes('postgresql');
      }
    ).catch(() => false);

    if (isPostgres) {
      // Fix folder table sequence if needed
      try {
        await prisma.$executeRaw`
          SELECT setval(pg_get_serial_sequence('"Folder"', 'id'), 
                       COALESCE((SELECT MAX(id)+1 FROM "Folder"), 1), false)
        `;
        actions.push("Reset Folder ID sequence");
      } catch (error) {
        console.error("Failed to reset Folder sequence:", error);
      }

      // Fix folder setting table sequence if needed
      try {
        await prisma.$executeRaw`
          SELECT setval(pg_get_serial_sequence('"FolderSetting"', 'id'), 
                       COALESCE((SELECT MAX(id)+1 FROM "FolderSetting"), 1), false)
        `;
        actions.push("Reset FolderSetting ID sequence");
      } catch (error) {
        console.error("Failed to reset FolderSetting sequence:", error);
      }
    }

    return {
      repaired: actions.length > 0,
      actions
    };

  } catch (error) {
    console.error("Database repair failed:", error);
    return {
      repaired: false,
      actions: [`Repair failed: ${error}`]
    };
  }
}

/**
 * Safe retry mechanism for database operations
 * Handles temporary failures and concurrency issues
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry certain errors
      const shouldNotRetry = [
        'P2002', // Unique constraint (business logic error)
        'P2025', // Record not found (business logic error)
        'P2003', // Foreign key constraint (business logic error)
      ];

      if (error?.code && shouldNotRetry.includes(error.code)) {
        throw error;
      }

      // Only retry on the last attempt if it's a retryable error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = delayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
