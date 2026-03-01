# Deployment Guide - Vercel

## Prerequisites
Pastikan Anda memiliki:
- ✅ Vercel account (https://vercel.com)
- ✅ PostgreSQL database (Neon, Supabase, atau Amazon RDS)
- ✅ GitHub connected ke Vercel

## Langkah-langkah Deployment

### 1. Setup Database PostgreSQL
Pilih salah satu:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Amazon RDS**: Managed PostgreSQL

Dapatkan connection string format:
```
postgres://user:password@host:5432/dbname
```

### 2. Deploy ke Vercel
```bash
# Option A: Via Vercel CLI
npm i -g vercel
vercel

# Option B: Via GitHub
# 1. Push code ke GitHub
# 2. Go to https://vercel.com/new
# 3. Import repository
# 4. Set environment variables (lihat step 3)
```

### 3. Set Environment Variables di Vercel
Di Vercel Project Settings → Environment Variables:

```
DATABASE_URL = postgres://user:password@host:5432/dbname
```

**Important:** Jangan set `NEXT_PUBLIC_API_URL` di production. 
App akan otomatis gunakan domain Vercel deployment.

### 4. Trigger Build
```bash
git push origin main
# Vercel akan otomatis build dan deploy
```

### 5. Setup Admin User (After First Deployment)
Setelah deployment sukses, jalankan di Vercel terminal atau local:
```bash
# Local dengan production database
$env:DATABASE_URL="postgres://user:password@host:5432/dbname"
$env:EMAIL="admin@example.com"
$env:PASSWORD="your-password"
$env:NAME="Administrator"
node scripts/create-admin.js
```

Atau gunakan Vercel CLI:
```bash
vercel env pull
npm run create-admin
```

## Testing After Deployment

1. **Frontend Access**: https://your-app-name.vercel.app
2. **Login Test**: admin@example.com / your-password
3. **Admin Dashboard**: https://your-app-name.vercel.app/admin/dashboard
4. **API Test**: https://your-app-name.vercel.app/api/login (POST request)

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` di Vercel environment variables
- Check database is accessible from Vercel regions
- Run `npx prisma db push` locally to test connection

### API Not Responding
- Check build logs di Vercel
- Verify migrations ran successfully  
- Check console in browser DevTools for errors

### 500 Error on Login
- Check Vercel Function logs
- Verify DATABASE_URL is set correctly
- Ensure admin user exists in database

## Rollback
```bash
git revert <commit-hash>
git push origin main
# Vercel akan otomatis deploy versi sebelumnya
```

## Notes
- Relative API URLs (`/api/...`) otomatis bekerja di semua environment
- Database migrations berjalan otomatis saat build jika DATABASE_URL set
- Vercel serverless functions cold start OK untuk app ini
- Recommended region: Singapore (sin1) untuk Asia
