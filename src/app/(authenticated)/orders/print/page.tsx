'use client';

import { useEffect, useState } from 'react';
import { Invoice } from '@/components/orders/invoice';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Mark as dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

interface Order {
    id: string;
    createdAt: Date;
    customerName: string;
    customerPhone: string;
    customerSecondPhone?: string;
    customerAddress: string;
    product: {
        name: string;
        price: number;
    };
    quantity: number;
    discount: number;
    notes?: string;
    shippingProvider: string | null;
    trackingNumber: string | null;
    invoicePrinted: boolean;
    status: string;
}

export default function PrintPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedPendingOrders, setSelectedPendingOrders] = useState<string[]>([]);
    const [selectedPrintedOrders, setSelectedPrintedOrders] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'printed'>('pending');
    const [printMode, setPrintMode] = useState<'all' | 'selected'>('all');
    const [markingAsPrinted, setMarkingAsPrinted] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                // Fetch only SHIPPED orders
                const response = await fetch('/api/orders?status=SHIPPED');
                if (!response.ok) {
                    throw new Error('Failed to load orders');
                }
                const fetchedOrders = await response.json();
                setOrders(fetchedOrders);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Function to mark orders as printed
    const markOrdersAsPrinted = async (orderIds: string[]) => {
        setMarkingAsPrinted(true);
        try {
            // Update each order's print status
            const updatePromises = orderIds.map(orderId =>
                fetch(`/api/orders/${orderId}/invoice-print`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ printed: true }),
                })
            );

            const results = await Promise.allSettled(updatePromises);

            // Check if any failed
            const failedCount = results.filter(r => r.status === 'rejected').length;

            if (failedCount > 0) {
                toast.error(`Failed to mark ${failedCount} invoice(s) as printed`);
            } else {
                toast.success(`Successfully marked ${orderIds.length} invoice(s) as printed`);
                // Update the local state to reflect the changes
                setOrders(prev => prev.map(order =>
                    orderIds.includes(order.id)
                        ? { ...order, invoicePrinted: true }
                        : order
                ));
            }
        } catch (err) {
            console.error('Error marking orders as printed:', err);
            toast.error('Failed to update invoice print status');
        } finally {
            setMarkingAsPrinted(false);
        }
    };

    const handlePrint = () => {
        setPrintMode('all');
        setTimeout(() => {
            window.print();
            // After printing, mark pending orders as printed if we're on the pending tab
            if (activeTab === 'pending') {
                const pendingOrderIds = pendingOrders.map(order => order.id);
                if (pendingOrderIds.length > 0) {
                    markOrdersAsPrinted(pendingOrderIds);
                }
            }
        }, 100);
    };

    const handleSelectAllPending = () => {
        if (selectedPendingOrders.length === pendingOrders.length) {
            setSelectedPendingOrders([]);
        } else {
            setSelectedPendingOrders(pendingOrders.map(order => order.id));
        }
    };

    const handleSelectAllPrinted = () => {
        if (selectedPrintedOrders.length === printedOrders.length) {
            setSelectedPrintedOrders([]);
        } else {
            setSelectedPrintedOrders(printedOrders.map(order => order.id));
        }
    };

    const handleSelectPendingOrder = (orderId: string) => {
        setSelectedPendingOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleSelectPrintedOrder = (orderId: string) => {
        setSelectedPrintedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handlePrintSelected = () => {
        // Get the selected orders based on the active tab
        const selectedIds = activeTab === 'pending' ? selectedPendingOrders : selectedPrintedOrders;

        if (selectedIds.length === 0) return;

        setPrintMode('selected');
        setTimeout(() => {
            window.print();
            // After printing, mark the selected orders as printed if we're on the pending tab
            if (activeTab === 'pending' && selectedPendingOrders.length > 0) {
                markOrdersAsPrinted(selectedPendingOrders);
            }
        }, 100);
    };

    const sortedOrders = [...orders].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // All orders are already SHIPPED status from the API, just filter by print status
    const printedOrders = sortedOrders.filter(order => order.invoicePrinted);
    const pendingOrders = sortedOrders.filter(order => !order.invoicePrinted);

    // Get the selected orders data based on active tab
    const selectedOrdersData = activeTab === 'pending'
        ? sortedOrders.filter(order => selectedPendingOrders.includes(order.id))
        : sortedOrders.filter(order => selectedPrintedOrders.includes(order.id));

    if (loading) {
        return <div>Loading orders...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 bg-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold print:hidden text-gray-800">Print Shipped Invoices</h1>
                <div className="flex items-center space-x-4 print:hidden">
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Print Current Tab
                    </Button>
                    {((activeTab === 'pending' && selectedPendingOrders.length > 0) ||
                        (activeTab === 'printed' && selectedPrintedOrders.length > 0)) && (
                            <Button
                                onClick={handlePrintSelected}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Print {activeTab === 'pending' ? selectedPendingOrders.length : selectedPrintedOrders.length} Selected
                            </Button>
                        )}
                </div>
            </div>

            <Tabs defaultValue="pending" className="print:hidden" onValueChange={(value) => setActiveTab(value as 'pending' | 'printed')}>
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 bg-gray-200">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-white text-gray-900 font-medium">
                        Pending Shipped ({pendingOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="printed" className="data-[state=active]:bg-white text-gray-900 font-medium">
                        Printed Shipped ({printedOrders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    {pendingOrders.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md">
                            <p className="text-gray-800 font-medium">No pending shipped invoices to print</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="select-all-pending"
                                        checked={selectedPendingOrders.length === pendingOrders.length && pendingOrders.length > 0}
                                        onChange={handleSelectAllPending}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="select-all-pending" className="text-sm text-gray-800">
                                        {selectedPendingOrders.length === pendingOrders.length && pendingOrders.length > 0
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </label>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedPendingOrders.length} of {pendingOrders.length} selected
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingOrders.map((order, index) => {
                                    // Get the index of the order in the selectedOrders array for numbering
                                    let selectedIndex = -1;
                                    if (selectedPendingOrders.includes(order.id)) {
                                        selectedIndex = selectedPendingOrders.findIndex(id => id === order.id);
                                    }

                                    return (
                                        <div key={order.id} className={`border rounded-lg p-2 bg-white shadow-md relative ${selectedPendingOrders.includes(order.id) ? 'ring-2 ring-blue-500' : ''}`}>
                                            <div className="absolute top-2 left-2 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPendingOrders.includes(order.id)}
                                                    onChange={() => handleSelectPendingOrder(order.id)}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mb-2 pl-6">
                                                <div className="text-sm text-gray-800">
                                                    <span className="font-medium">Order ID:</span> {order.id.substring(0, 8)}...
                                                </div>
                                                <div className="text-sm flex flex-col items-end">
                                                    <span className="text-gray-800">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</span>
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <Invoice
                                                order={order}
                                                isMultiPrint={true}
                                                showPrintControls={true}
                                                invoiceNumber={selectedIndex !== -1 ? selectedIndex + 1 : undefined}
                                                totalInvoices={selectedPendingOrders.length}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="printed">
                    {printedOrders.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg shadow-md">
                            <p className="text-gray-800 font-medium">No printed shipped invoices</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="select-all-printed"
                                        checked={selectedPrintedOrders.length === printedOrders.length && printedOrders.length > 0}
                                        onChange={handleSelectAllPrinted}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="select-all-printed" className="text-sm text-gray-800">
                                        {selectedPrintedOrders.length === printedOrders.length && printedOrders.length > 0
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </label>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {selectedPrintedOrders.length} of {printedOrders.length} selected
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {printedOrders.map((order, index) => {
                                    // Get the index of the order in the selectedOrders array for numbering
                                    let selectedIndex = -1;
                                    if (selectedPrintedOrders.includes(order.id)) {
                                        selectedIndex = selectedPrintedOrders.findIndex(id => id === order.id);
                                    }

                                    return (
                                        <div key={order.id} className={`border rounded-lg p-2 bg-white shadow-md relative ${selectedPrintedOrders.includes(order.id) ? 'ring-2 ring-blue-500' : ''}`}>
                                            <div className="absolute top-2 left-2 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPrintedOrders.includes(order.id)}
                                                    onChange={() => handleSelectPrintedOrder(order.id)}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mb-2 pl-6">
                                                <div className="text-sm text-gray-800">
                                                    <span className="font-medium">Order ID:</span> {order.id.substring(0, 8)}...
                                                </div>
                                                <div className="text-sm flex flex-col items-end">
                                                    <span className="text-gray-800">{format(new Date(order.createdAt), 'dd/MM/yyyy')}</span>
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <Invoice
                                                order={order}
                                                isMultiPrint={true}
                                                showPrintControls={true}
                                                invoiceNumber={selectedIndex !== -1 ? selectedIndex + 1 : undefined}
                                                totalInvoices={selectedPrintedOrders.length}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Print view for all invoices - only shown when printing all */}
            <div className={`hidden ${printMode === 'all' ? 'print:block' : 'print:hidden'} print:bg-white print:text-black`}>
                <h1 className="text-2xl font-bold mb-6 text-black">{sortOrder === 'newest' ? 'Newest' : 'Oldest'} Shipped Invoices - {activeTab === 'pending' ? 'Pending' : 'Printed'}</h1>

                {/* Group orders into chunks of 8 for pagination */}
                {chunk((activeTab === 'pending' ? pendingOrders : printedOrders), 8).map((pageOrders, pageIndex) => (
                    <div
                        key={pageIndex}
                        className={pageIndex > 0 ? 'page-break-before' : ''}
                        style={{
                            pageBreakAfter: 'always',
                            breakAfter: 'page',
                            breakInside: 'avoid'
                        }}
                    >
                        <div className="grid grid-cols-2 gap-1">
                            {pageOrders.map((order, index) => (
                                <div key={order.id} className="border p-1 bg-white shadow-sm">
                                    <Invoice
                                        order={order}
                                        isMultiPrint={true}
                                        invoiceNumber={(pageIndex * 8) + index + 1}
                                        totalInvoices={activeTab === 'pending' ? pendingOrders.length : printedOrders.length}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Print view for selected invoices */}
            <div className={`hidden ${printMode === 'selected' ? 'print:block' : 'print:hidden'} print:bg-white print:text-black`}>
                <h1 className="text-2xl font-bold mb-6 text-black">Selected {activeTab === 'pending' ? 'Pending' : 'Printed'} Shipped Invoices ({selectedOrdersData.length})</h1>

                {/* Group orders into chunks of 8 for pagination */}
                {chunk(selectedOrdersData, 8).map((pageOrders, pageIndex) => (
                    <div
                        key={pageIndex}
                        className={pageIndex > 0 ? 'page-break-before' : ''}
                        style={{
                            pageBreakAfter: 'always',
                            breakAfter: 'page',
                            breakInside: 'avoid'
                        }}
                    >
                        <div className="grid grid-cols-2 gap-1">
                            {pageOrders.map((order, index) => (
                                <div key={order.id} className="border p-1 bg-white shadow-sm">
                                    <Invoice
                                        order={order}
                                        isMultiPrint={true}
                                        invoiceNumber={(pageIndex * 8) + index + 1}
                                        totalInvoices={selectedOrdersData.length}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper function to split array into chunks
function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
} 