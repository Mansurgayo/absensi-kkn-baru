const { execSync } = require('child_process');

try {
  // DATABASE_URL must be set in environment for production
  if (!process.env.DATABASE_URL) {
    console.error('[build] ERROR: DATABASE_URL is not set in environment variables');
    process.exit(1);
  }
  
  console.log('[build] DATABASE_URL detected, running migrations...');
  
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
