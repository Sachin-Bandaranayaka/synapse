// src/lib/prisma.ts

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const prisma = global._prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}

/**
 * Creates a tenant-scoped Prisma client.
 * Every query will be automatically filtered by the provided tenantId.
 * @param {string} tenantId - The ID of the current tenant.
 * @returns A tenant-scoped Prisma client instance.
 */
export const getScopedPrismaClient = (tenantId: string) => {
  if (!tenantId) {
    throw new Error("Tenant ID must be provided to create a scoped client.");
  }

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const newArgs = { ...args };
          
          // List of all operations that use a 'where' clause
          const operationsWithWhere = [
            'findUnique', 'findFirst', 'findMany', 
            'update', 'updateMany', 
            'delete', 'deleteMany', 
            'count', 'aggregate', 'groupBy'
          ];

          if (operationsWithWhere.includes(operation)) {
            // For all these operations, inject the tenantId into the where clause
            const argsWithWhere = newArgs as { where?: Record<string, any> };
            argsWithWhere.where = { ...(argsWithWhere.where || {}), tenantId };
          } else if (operation === 'create') {
            // For 'create', inject tenantId only if not already connecting the tenant
            const argsWithData = newArgs as { data?: { tenant?: any, tenantId?: string } };
            if (argsWithData.data && !argsWithData.data.tenant && !argsWithData.data.tenantId) {
              argsWithData.data.tenantId = tenantId;
            }
          }
          
          return query(newArgs);
        },
      },
    },
  });
};