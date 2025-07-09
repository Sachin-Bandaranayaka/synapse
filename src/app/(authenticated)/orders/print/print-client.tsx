// src/app/(authenticated)/orders/print/print-client.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice } from '@/components/orders/invoice';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant, Order, Product, OrderStatus } from '@prisma/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

type OrderWithProduct = Order & { product: Product };

interface PrintClientProps {
  initialOrders: OrderWithProduct[];
  tenant: Tenant;
}

export function PrintClient({ initialOrders, tenant }: PrintClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'printed'>('pending');

  const { pendingOrders, printedOrders } = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return {
      pendingOrders: sorted.filter(o => !o.invoicePrinted),
      printedOrders: sorted.filter(o => o.invoicePrinted),
    };
  }, [orders, sortOrder]);

  const currentList = activeTab === 'pending' ? pendingOrders : printedOrders;

  useEffect(() => {
    setSelectedOrderIds([]);
  }, [activeTab]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    const allIdsOnPage = currentList.map(o => o.id);
    if (selectedOrderIds.length === allIdsOnPage.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(allIdsOnPage);
    }
  };

  const updatePrintStatus = async (idsToUpdate: string[], printed: boolean) => {
    const endpoint = printed ? '/api/orders/bulk/mark-printed' : '/api/orders/bulk/mark-pending';
    const successMessage = `${idsToUpdate.length} invoice(s) successfully marked as ${printed ? 'printed' : 'pending'}.`;
    const errorMessage = `Failed to mark as ${printed ? 'printed' : 'pending'}.`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: idsToUpdate }),
      });
      if (!response.ok) throw new Error(errorMessage);
      
      toast.success(successMessage);
      setOrders(prev =>
        prev.map(order =>
          idsToUpdate.includes(order.id) ? { ...order, invoicePrinted: printed } : order
        )
      );
      setSelectedOrderIds([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorMessage);
    }
  };

  // --- FIX: Use the browser's 'afterprint' event for more reliable state updates ---
  useEffect(() => {
    const handleAfterPrint = () => {
      // This function runs after the print dialog is closed.
      // We only mark as printed if we were on the pending tab and had items selected.
      if (activeTab === 'pending' && selectedOrderIds.length > 0) {
        updatePrintStatus(selectedOrderIds, true);
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [activeTab, selectedOrderIds]); // Re-bind the listener if these dependencies change

  const handlePrint = () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('Please select at least one invoice to print.');
      return;
    }
    // This just opens the print dialog. The 'afterprint' event handles the rest.
    window.print();
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background-color: #fff !important; }
          .print-container { display: flex; flex-wrap: wrap; justify-content: flex-start; align-content: flex-start; gap: 0; }
          .invoice-page { width: 105mm; height: 59.4mm; padding: 5mm; border: 1px dashed #ccc; box-sizing: border-box; overflow: hidden; color: #000; page-break-inside: avoid; }
        }
      `}</style>
      
      <div className="print:hidden container mx-auto p-4 space-y-4 bg-gray-900 text-white min-h-screen">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Print Invoices</h1>
          <div className="flex items-center space-x-4">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Newest First</SelectItem><SelectItem value="oldest">Oldest First</SelectItem></SelectContent>
            </Select>
            <Button onClick={handlePrint} disabled={selectedOrderIds.length === 0} className="bg-blue-600 hover:bg-blue-700">
              Print Selected ({selectedOrderIds.length})
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 text-gray-300">
            <TabsTrigger value="pending" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="printed" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Printed ({printedOrders.length})</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 rounded-lg bg-gray-800 ring-1 ring-white/10">
            <div className="flex justify-between items-center gap-4 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <input type="checkbox" className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500" onChange={handleSelectAll} checked={currentList.length > 0 && selectedOrderIds.length === currentList.length} />
                <label className="text-sm font-medium">Select All</label>
              </div>
              {activeTab === 'printed' && (
                <Button onClick={() => updatePrintStatus(selectedOrderIds, false)} disabled={selectedOrderIds.length === 0} variant="outline" size="sm">
                  Move to Pending ({selectedOrderIds.length})
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 max-h-[70vh] overflow-y-auto">
              {currentList.map(order => (
                <div key={order.id} className={`rounded-lg bg-gray-900/50 ring-1 ring-white/10 relative cursor-pointer ${selectedOrderIds.includes(order.id) ? 'ring-indigo-500 ring-2' : ''}`} onClick={() => handleSelectOrder(order.id)}>
                  <div className="absolute top-3 left-3 z-10">
                    <input type="checkbox" className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500 pointer-events-none" checked={selectedOrderIds.includes(order.id)} readOnly />
                  </div>
                  <div className="flex justify-between items-start mb-2 pl-10">
                    <h3 className="text-sm font-medium text-gray-300">Order ID: {order.id.substring(0, 8)}...</h3>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${order.status === OrderStatus.SHIPPED ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-md overflow-hidden">
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
                </div>
              ))}
              {currentList.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500">No orders in this tab.</div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

     {/* Print View */}
     <div className="hidden print:block bg-white text-black">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 max-h-[70vh] overflow-y-auto">
          {currentList.map(order => (
            <div key={order.id} className={`rounded-lg border border-black p-2 relative cursor-pointer ${selectedOrderIds.includes(order.id) }`} >
              <div className="bg-white rounded-md overflow-hidden">
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
            </div>
          ))}
          {currentList.length === 0 && (
            <div className="col-span-full p-8 text-center text-gray-500">No orders in this tab.</div>
          )}
        </div>
      </div>
    </>
  );
}
