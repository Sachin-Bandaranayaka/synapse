const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jnex.com' },
    update: {},
    create: {
      email: 'admin@jnex.com',
      name: 'Admin User',
      password,
      role: 'ADMIN',
      permissions: ['*'],
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
