// src/app/(authenticated)/products/page.tsx

import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductsClient } from "./products-client";
import { transformProduct } from "@/lib/products";
import { User } from "next-auth"; // Import the User type

export default async function ProductsPage() {
  const session = await getSession();
  
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  // Redirect if a user without VIEW_PRODUCTS permission lands here
  if (session.user.role === 'TEAM_MEMBER' && !session.user.permissions?.includes('VIEW_PRODUCTS')) {
    return redirect('/unauthorized');
  }

  const prisma = getScopedPrismaClient(session.user.tenantId);

  const products = await prisma.product.findMany({
    orderBy: {
      name: 'asc'
    },
    include: {
      _count: { select: { orders: true, leads: true } },
      stockAdjustments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const transformedProducts = products.map(transformProduct);

  // --- THE FIX ---
  // Pass the user object to the client component
  return <ProductsClient initialProducts={transformedProducts} user={session.user as User} />;
}