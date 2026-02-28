const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const prisma = new PrismaClient();
    const email = process.env.EMAIL || 'adminkkn@gmail.com';
    const password = process.env.PASSWORD || 'admin123';
    const name = process.env.NAME || 'Admin KKN';

    const hashed = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const updated = await prisma.user.update({
        where: { email },
        data: { password: hashed, role: 'ADMIN', name },
      });
      console.log('UPDATED', updated.id);
    } else {
      const created = await prisma.user.create({
        data: {
          email,
          name,
          password: hashed,
          role: 'ADMIN',
        },
      });
      console.log('CREATED', created.id);
    }

    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
