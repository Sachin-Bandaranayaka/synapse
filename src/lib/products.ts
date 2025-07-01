// src/lib/products.ts

import { Product, StockAdjustment } from "@prisma/client";

// Define the type for the raw product data we get from Prisma
type ProductWithDetails = Product & {
  _count: {
    orders: number;
    leads: number;
  };
  stockAdjustments: StockAdjustment[];
};

// This function transforms the raw data into the format our components expect
export function transformProduct(product: ProductWithDetails) {
  return {
    ...product,
    totalOrders: product._count.orders,
    totalLeads: product._count.leads,
    // Ensure lastStockUpdate is always a valid date string or null
    lastStockUpdate: (product.stockAdjustments[0]?.createdAt || product.updatedAt).toISOString(),
  };
}