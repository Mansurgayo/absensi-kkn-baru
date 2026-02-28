const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const prisma = new PrismaClient();
    const email = process.env.EMAIL || 'adminkkn@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('NO_USER');
      await prisma.$disconnect();
      return;
    }
    const ok = await bcrypt.compare(process.env.PASSWORD || 'admin123', user.password);
    console.log('COMPARE', ok);
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
