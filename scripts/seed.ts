import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Create a default tenant
    const tenant = await prisma.tenant.upsert({
        where: { name: 'Default Tenant' },
        update: {},
        create: {
            name: 'Default Tenant',
        },
    });

    // Create admin user
    const password = await hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jnex.com' },
        update: {},
        create: {
            email: 'admin@jnex.com',
            name: 'Admin',
            password,
            role: Role.ADMIN,
            permissions: ['all'],
            tenant: {
                connect: {
                    id: tenant.id
                }
            }
        },
    });

    console.log({ admin, tenant });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
