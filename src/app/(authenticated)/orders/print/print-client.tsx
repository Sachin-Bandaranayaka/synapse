'use client';

import { useState, useMemo } from 'react';
import { Invoice } from '@/components/orders/invoice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tenant, Order, Product } from '@prisma/client';
import { toast } from 'sonner';

// Define the shape of the order object with the included product
type OrderWithProduct = Order & { product: Product };

interface PrintClientProps {
  initialOrders: OrderWithProduct[];
  tenant: Tenant;
}

export function PrintClient({ initialOrders, tenant }: PrintClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'printed'>('pending');

  // Memoize sorted lists to prevent recalculation on every render
  const pendingOrders = useMemo(() => orders.filter(o => !o.invoicePrinted), [orders]);
  const printedOrders = useMemo(() => orders.filter(o => o.invoicePrinted), [orders]);

  const currentList = activeTab === 'pending' ? pendingOrders : printedOrders;

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    const allIdsOnPage = currentList.map(o => o.id);
    // If all are already selected, deselect all. Otherwise, select all.
    if (selectedOrderIds.length === allIdsOnPage.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(allIdsOnPage);
    }
  };

  const handlePrint = () => {
    if (selectedOrderIds.length === 0) {
        toast.warning('Please select at least one invoice to print.');
        return;
    }
    // The print-only CSS will take care of what gets printed
    window.print();
  };

  return (
    <>
      {/* SECTION 1: UI for the screen (hidden on print) */}
      <div className="print:hidden container mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Print Invoices</h1>
          <Button onClick={handlePrint} disabled={selectedOrderIds.length === 0}>
            Print ({selectedOrderIds.length}) Selected
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'printed')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="printed">Printed ({printedOrders.length})</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <div className="flex items-center gap-4 px-2 py-2 border-b border-gray-200">
                <input
                    type="checkbox"
                    className="h-4 w-4"
                    onChange={handleSelectAll}
                    checked={currentList.length > 0 && selectedOrderIds.length === currentList.length}
                />
                <label className="text-sm font-medium">Select All</label>
            </div>
            <ul className="divide-y divide-gray-200">
              {currentList.map(order => (
                <li key={order.id} className="flex items-center gap-4 p-2 hover:bg-gray-50">
                    <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                    />
                    <div className="flex-grow">
                        <p className="font-medium text-sm">Order #{order.number} - {order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.product.name}</p>
                    </div>
                </li>
              ))}
            </ul>
          </div>
        </Tabs>
      </div>

      {/* SECTION 2: Content that is ONLY visible when printing */}
      <div className="hidden print:block">
        {orders
          .filter(order => selectedOrderIds.includes(order.id)) // Only include selected orders
          .map(order => (
            <div key={order.id} className="invoice-page">
              <Invoice
                order={order}
                businessName={tenant.businessName}
                businessAddress={tenant.businessAddress}
                businessPhone={tenant.businessPhone}
                // --- FIX: This now creates a string, solving the type error ---
                invoiceNumber={`${tenant.invoicePrefix || 'INV'}-${order.number}`}
                isMultiPrint={true}
                showPrintControls={false}
              />
            </div>
          ))
        }
      </div>
    </>
  );
}
