// src/app/(authenticated)/products/page.tsx

import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductsClient } from "./products-client";
import { transformProduct } from "@/lib/products"; // <-- Import our new helper

export default async function ProductsPage() {
  const session = await getSession();
  
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  const prisma = getScopedPrismaClient(session.user.tenantId);

  const products = await prisma.product.findMany({
    orderBy: {
      name: 'asc'
    },
    // We must include the same data the transformProduct function needs
    include: {
      _count: { select: { orders: true, leads: true } },
      stockAdjustments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  // Use the helper function to transform the data before sending to the client
  const transformedProducts = products.map(transformProduct);

  return <ProductsClient initialProducts={transformedProducts} />;
}