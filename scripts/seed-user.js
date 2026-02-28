const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const prisma = new PrismaClient();
    const hashed = await bcrypt.hash(process.env.PASSWORD || 'test123', 10);
    const user = await prisma.user.create({
      data: {
        email: process.env.EMAIL || 'mansur677776@gmail.com',
        name: process.env.NAME || 'Mansur',
        password: hashed,
      },
    });
    console.log('CREATED', user.id);
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
