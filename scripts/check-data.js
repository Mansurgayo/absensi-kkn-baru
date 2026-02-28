const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  console.log('\n=== USERS ===');
  const users = await prisma.user.findMany();
  console.log(users);
  
  console.log('\n=== ATTENDANCE ===');
  const attendances = await prisma.attendance.findMany({ include: { user: true } });
  console.log(attendances);
  
  await prisma.$disconnect();
})();