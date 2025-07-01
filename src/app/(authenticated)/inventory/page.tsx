// src/app/(authenticated)/inventory/page.tsx

import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InventoryClient } from "./inventory-client"; // Import our new client component

export default async function InventoryPage() {
  // 1. Get the server-side session and tenantId
  const session = await getSession();
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  // 2. Get the scoped Prisma client for the current tenant
  const prisma = getScopedPrismaClient(session.user.tenantId);

  // 3. Fetch only the products for that tenant
  const products = await prisma.product.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      code: true,
      name: true,
      price: true,
      stock: true,
      lowStockAlert: true,
    }
  });

  // 4. Render the client component, passing the securely fetched products as a prop
  return <InventoryClient initialProducts={products} />;
}