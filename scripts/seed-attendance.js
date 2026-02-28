const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();

  // find a regular user
  const user = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!user) {
    console.log('No regular user found to associate attendance with.');
    await prisma.$disconnect();
    return;
  }

  // coordinates taken from Lamkawee, Aceh (user-provided location)
  const att = await prisma.attendance.create({
    data: {
      userId: user.id,
      latitude: 5.5025285,
      longitude: 95.3324727,
    },
  });

  console.log('Created attendance:', att);
  await prisma.$disconnect();
})();