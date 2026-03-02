const { execSync } = require('child_process');

try {
  if (process.env.DATABASE_URL) {
    console.log('[build] DATABASE_URL detected, running migrations...');
    
    // Ensure DATABASE_URL has file: protocol for SQLite
    if (!process.env.DATABASE_URL.startsWith('file:')) {
      process.env.DATABASE_URL = `file:${process.env.DATABASE_URL}`;
      console.log('[build] formatted DATABASE_URL with file: protocol');
    }
    
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } else {
    console.log('[build] no DATABASE_URL defined, skipping migrations');
  }
  console.log('[build] running next build');
  execSync('npx next build', { stdio: 'inherit' });
} catch (err) {
  console.error('[build] error during build', err);
  process.exit(1);
}
