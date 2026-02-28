const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'adminkkn@gmail.com' },
    data: { password: hashed },
  });
  console.log('password reset to admin123');
  await prisma.$disconnect();
})();