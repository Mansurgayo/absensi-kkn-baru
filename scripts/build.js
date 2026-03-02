const { execSync } = require('child_process');

try {
  // Set DATABASE_URL if not already set (use local SQLite)
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./prisma/dev.db';
    console.log('[build] DATABASE_URL not set, using fallback: file:./prisma/dev.db');
  } else {
    console.log('[build] DATABASE_URL detected, using:', process.env.DATABASE_URL);
    
    // Ensure DATABASE_URL has file: protocol for SQLite
    if (!process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = `file:${process.env.DATABASE_URL}`;
      console.log('[build] formatted DATABASE_URL with file: protocol');
    }
  }
  
  console.log('[build] running prisma migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  console.log('[build] creating/updating admin user...');
  try {
    execSync('node scripts/create-admin.js', { stdio: 'inherit' });
  } catch (err) {
    console.log('[build] admin setup completed or skipped');
  }
  
  console.log('[build] running next build');
  execSync('npx next build', { stdio: 'inherit' });
} catch (err) {
  console.error('[build] error during build', err);
  process.exit(1);
}
