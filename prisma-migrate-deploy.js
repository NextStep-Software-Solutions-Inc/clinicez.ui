#!/usr/bin/env node
const { execSync } = require('child_process');

// For Prisma 7, we need to provide datasource configuration
// Create a temporary config file for migrations
const fs = require('fs');
const configContent = `
module.exports = {
  datasources: {
    db: {
      url: "${process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED}"
    }
  }
};
`;

try {
  // Write temporary config
  fs.writeFileSync('prisma.config.cjs', configContent);
  
  // Run migrate deploy
  execSync('prisma migrate deploy', { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync('prisma.config.cjs');
} catch (error) {
  // Clean up on error
  if (fs.existsSync('prisma.config.cjs')) {
    fs.unlinkSync('prisma.config.cjs');
  }
  process.exit(1);
}
