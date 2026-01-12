#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

// Use a CJS config file; Prisma picks up prisma.config.js automatically.
// Point the datasource URL to the env variable Prisma expects at build time.

// Prisma 7 requires datasource URLs to be provided via a Prisma config file.
// Generate a temporary prisma.config.ts that points to DATABASE_URL (or DATABASE_URL_UNPOOLED).
const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL (or DATABASE_URL_UNPOOLED) is required for migrations.');
  process.exit(1);
}

const serializedUrl = JSON.stringify(dbUrl);
const configContent = `module.exports = { datasources: { db: { url: ${serializedUrl} } } };\n`;

try {
  fs.writeFileSync('prisma.config.js', configContent, { encoding: 'utf8' });
  execSync('prisma migrate deploy', { stdio: 'inherit' });
} finally {
  if (fs.existsSync('prisma.config.js')) {
    fs.unlinkSync('prisma.config.js');
  }
}
