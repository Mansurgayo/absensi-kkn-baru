const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const prisma = new PrismaClient();
    const u = await prisma.user.findUnique({ where: { email: process.env.EMAIL || 'mansur677776@gmail.com' } });
    console.log(JSON.stringify(u, null, 2));
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
