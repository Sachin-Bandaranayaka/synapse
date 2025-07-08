import { getSession } from "@/lib/auth";
import { getScopedPrismaClient } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductsClient } from "./products-client";
import { transformProduct } from "@/lib/products";
import { User } from "next-auth";

export default async function ProductsPage() {
  const session = await getSession();
  
  if (!session?.user?.tenantId) {
    return redirect('/auth/signin');
  }

  if (session.user.role === 'TEAM_MEMBER' && !session.user.permissions?.includes('VIEW_PRODUCTS')) {
    return redirect('/unauthorized');
  }

  const prisma = getScopedPrismaClient(session.user.tenantId);

  const products = await prisma.product.findMany({
    // --- FIX: Add a 'where' clause to only fetch active products ---
    where: {
      isActive: true,
    },
    orderBy: {
      name: 'asc'
    },
    include: {
      _count: { select: { orders: true, leads: true } },
      stockAdjustments: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const transformedProducts = products.map(transformProduct);

  return <ProductsClient initialProducts={transformedProducts} user={session.user as User} />;
}
