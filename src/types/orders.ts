// src/types/orders.ts

export interface CreateOrderData {
    leadId: string;
    userId: string;
    quantity: number;
    tenantId: string; // <-- ADD THIS LINE
  }