// src/app/(authenticated)/orders/print/print-client.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
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

  // When the component loads, automatically select all pending orders by default.
  useEffect(() => {
    const pendingIds = initialOrders.filter(o => !o.invoicePrinted).map(o => o.id);
    setSelectedOrderIds(pendingIds);
  }, [initialOrders]);

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
    if (selectedOrderIds.length === allIdsOnPage.length && currentList.every(o => selectedOrderIds.includes(o.id))) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(allIdsOnPage);
    }
  };

  const handlePrint = async () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('Please select at least one invoice to print.');
      return;
    }

    // The print-only CSS will take care of what gets printed
    window.print();

    // After printing, mark the selected orders as printed
    try {
      const response = await fetch('/api/orders/bulk/mark-printed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrderIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update invoice statuses.');
      }

      // Update the local state to move printed orders to the 'Printed' tab
      const updatedOrders = orders.map(order =>
        selectedOrderIds.includes(order.id) ? { ...order, invoicePrinted: true } : order
      );
      setOrders(updatedOrders);
      setSelectedOrderIds([]); // Clear selection after printing
      toast.success(`${selectedOrderIds.length} invoices marked as printed.`);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred.');
    }
  };

  return (
    <>
      {/* --- FINAL FIX: A more robust approach for continuous printing --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm; /* Margin for the physical page */
          }
          body {
            // background-color: #fff !important;
          }
          .print-container {
            /* No special layout needed, just let the divs stack */
          }
          .invoice-page {
            width: 105mm; /* Half A4 width */
            margin: 0 auto 5mm auto; /* Center horizontally, add bottom margin for spacing */
            overflow: hidden;
            box-shadow: none;
            color: #000;
            page-break-inside: avoid !important; /* Crucial rule to prevent invoices from splitting */
          }
          .invoice{
            page-break-inside: avoid !important;
            border: 1px dashed #ccc;
            padding: 5px;
          }
        }
      `}</style>

      {/* SECTION 1: UI for the screen (hidden on print) */}
      <div className="print:hidden container mx-auto p-4 space-y-4 bg-gray-900 text-white min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Print Invoices</h1>
          <Button onClick={handlePrint} disabled={selectedOrderIds.length === 0}>
            Print ({selectedOrderIds.length}) Selected
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'printed')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 text-gray-300">
            <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="printed" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Printed ({printedOrders.length})</TabsTrigger>
          </TabsList>

          <div className="mt-4 rounded-lg bg-gray-800 ring-1 ring-white/10">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                onChange={handleSelectAll}
                checked={currentList.length > 0 && currentList.every(o => selectedOrderIds.includes(o.id))}
              />
              <label className="text-sm font-medium">Select All</label>
            </div>
            <ul className="divide-y divide-gray-700 max-h-[70vh] overflow-y-auto">
              {currentList.map(order => (
                <li key={order.id} className="flex items-center gap-4 p-4 hover:bg-gray-700/50 cursor-pointer" onClick={() => handleSelectOrder(order.id)}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    checked={selectedOrderIds.includes(order.id)}
                    readOnly
                  />
                  <div className="flex-grow">
                    <p className="font-medium text-sm text-gray-200">Order #{order.id.slice(0, 8)} - {order.customerName}</p>
                    <p className="text-xs text-gray-400">{order.product.name}</p>
                  </div>
                </li>
              ))}
              {currentList.length === 0 && (
                <li className="p-8 text-center text-gray-500">No orders in this tab.</li>
              )}
            </ul>
          </div>
        </Tabs>
      </div>

      {/* SECTION 2: Content that is ONLY visible when printing */}
      <div className="hidden print:block bg-white text-black print-container">
        <div className="invoice-page">
          {orders
            .filter(order => selectedOrderIds.includes(order.id))
            .map(order => (
              <div key={order.id} className='my-4 invoice'>
                <Invoice
                  order={order}
                  businessName={tenant.businessName}
                  businessAddress={tenant.businessAddress}
                  businessPhone={tenant.businessPhone}
                  invoiceNumber={`${tenant.invoicePrefix || 'INV'}-${order.number}`}
                  isMultiPrint={true}
                  showPrintControls={false}
                />
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}
