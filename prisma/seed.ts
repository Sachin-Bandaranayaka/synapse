// prisma/seed.ts

import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 1. Create the first master tenant for the whole system
  const tenant = await prisma.tenant.upsert({
    where: { name: 'J-nex Holdings Master' },
    update: {},
    create: {
      name: 'J-nex Holdings Master',
      isActive: true,
    },
  })

  // 2. Create the Super Admin user
  const superAdminPassword = await hash('superadmin123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@jnex.com' },
    update: {},
    create: {
      email: 'superadmin@jnex.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN, // Use the SUPER_ADMIN role
      permissions: ['all'],
      // Link the user to the master tenant created above
      tenantId: tenant.id,
    },
  })

  console.log('Database seeded successfully!')
  console.log({
    tenant,
    superAdmin,
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })