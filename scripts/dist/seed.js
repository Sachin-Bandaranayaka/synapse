"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = require("bcrypt");
const prisma = new client_1.PrismaClient();
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
    const password = await (0, bcrypt_1.hash)('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@jnex.com' }, tsconfig, : .json,
        update: {},
        create: {
            email: 'admin@jnex.com',
            name: 'Admin',
            password,
            role: 'ADMIN',
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
//# sourceMappingURL=seed.js.map