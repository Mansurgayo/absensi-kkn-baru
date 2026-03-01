// ensure DATABASE_URL exists before Prisma client is imported
// this must happen at module load time to satisfy schema validation
if (!process.env.DATABASE_URL) {
  console.warn('[Prisma] WARNING: DATABASE_URL is not defined, falling back to sqlite dev.db');
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}
import { PrismaClient } from "@prisma/client"
import { join } from "path"

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

// when running on Vercel without a DATABASE_URL, provide a harmless fallback
if (!process.env.DATABASE_URL) {
  console.warn('[Prisma] WARNING: DATABASE_URL is not defined, falling back to sqlite dev.db (not persistent)');
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    try {
      console.log("[Prisma] Current working directory:", process.cwd())
      console.log("[Prisma] Looking for query engine at:")
      console.log("  - ", join(process.cwd(), ".prisma/client/query_engine-windows.dll.node"))
      console.log("  - ", join(process.cwd(), "../node_modules/.prisma/client/query_engine-windows.dll.node"))
      
      globalForPrisma.prisma = new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })
      
      console.log("[Prisma] Client initialized successfully")
    } catch (e) {
      console.error("[Prisma] Initialization error:", e)
      throw e
    }
  }
  return globalForPrisma.prisma
}

export const prisma = {
  get user() {
    return getPrismaClient().user
  },
  get attendance() {
    return getPrismaClient().attendance
  },
  $connect: () => getPrismaClient().$connect(),
  $disconnect: () => getPrismaClient().$disconnect(),
} as any

