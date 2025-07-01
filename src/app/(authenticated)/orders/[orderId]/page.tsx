// src/app/(authenticated)/orders/[orderId]/page.tsx

import { getScopedPrismaClient } from '@/lib/prisma'; // <-- Import our scoped client
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShippingForm } from '@/components/orders/shipping-form';
import { OrderJourney } from '@/components/orders/order-journey';
import { Invoice } from '@/components/orders/invoice';
import { PrintButton } from '@/components/orders/print-button';
import { CancelOrderButton } from '@/components/orders/cancel-order-button';

interface OrderDetailsPageProps {
    params: {
        orderId: string;
    };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
    const session = await getServerSession(authOptions);

    // 1. Secure the page and get tenantId
    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    // 2. Use the scoped client
    const prisma = getScopedPrismaClient(session.user.tenantId);

    // 3. This query is now SECURE. It will only find the order if the ID matches
    // AND the order belongs to the current tenant.
    const order = await prisma.order.findUnique({
        where: { id: params.orderId },
        include: {
            product: true,
            lead: true,
            assignedTo: true,
            trackingUpdates: {
                orderBy: {
                    timestamp: 'desc',
                },
            },
        },
    });

    if (!order) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h3 className="text-xl font-semibold">Order not found</h3>
                <p>This order may not exist or you may not have permission to view it.</p>
            </div>
        );
    }

    // --- NO UI CHANGES BELOW THIS LINE ---

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 print:space-y-0">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
                <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                    order.status === 'CANCELLED' ? 'bg-gray-200 text-gray-800' :
                                        'bg-red-100 text-red-800'
                        }`}>
                        {order.status.toLowerCase()}
                    </span>
                    {order.status === 'DELIVERED' && (
                        <a href={`/returns?orderId=${order.id}`} className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors">
                            Process Return
                        </a>
                    )}
                    <PrintButton />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                 {/* Invoice section remains the same */}
                 <div className="print:block col-span-12 lg:col-span-1 print:col-span-12">
                     <h2 className="font-semibold text-xl mb-6 print:hidden">Invoice</h2>
                     <div className="h-full print:h-auto">
                         <div className="h-full relative print:static">
                            <Invoice
                                order={{
                                    id: order.id,
                                    createdAt: order.createdAt,
                                    customerName: order.customerName,
                                    customerPhone: order.customerPhone,
                                    customerSecondPhone: order.customerSecondPhone,
                                    customerAddress: order.customerAddress,
                                    product: order.product,
                                    quantity: order.quantity,
                                    discount: order.discount,
                                    notes: order.notes,
                                    shippingProvider: order.shippingProvider,
                                    trackingNumber: order.trackingNumber,
                                    invoicePrinted: order.invoicePrinted
                                }}
                                showPrintControls={true}
                            />
                         </div>
                     </div>
                 </div>
                 
                 <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Order Journey */}
                    <div className="print:hidden rounded-lg bg-white overflow-hidden shadow">
                        <div className="px-6 py-5"><h3 className="text-lg font-medium text-gray-900">Order Journey</h3></div>
                        <div className="border-t border-gray-200 px-6 py-5"><OrderJourney order={order} /></div>
                    </div>

                    {/* Shipping Form */}
                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                        <div className="print:hidden rounded-lg bg-white overflow-hidden shadow">
                            <div className="px-6 py-5"><h3 className="text-lg font-medium text-gray-900">Shipping Information</h3></div>
                            <div className="border-t border-gray-200 px-6 py-5">
                                <ShippingForm
                                    orderId={order.id}
                                    currentProvider={order.shippingProvider || undefined}
                                    currentTrackingNumber={order.trackingNumber || undefined}
                                    order={{
                                        customerName: order.customerName,
                                        customerPhone: order.customerPhone,
                                        customerSecondPhone: order.customerSecondPhone,
                                        customerAddress: order.customerAddress,
                                        product: { name: order.product.name, price: order.product.price, },
                                        quantity: order.quantity,
                                        discount: order.discount,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Cancel Order Button */}
                    {order.status === 'CONFIRMED' && (
                        <div className="print:hidden rounded-lg bg-white overflow-hidden shadow">
                            <div className="px-6 py-5"><h3 className="text-lg font-medium text-gray-900">Order Actions</h3></div>
                            <div className="border-t border-gray-200 px-6 py-5">
                                <div className="flex flex-col space-y-4">
                                    <p className="text-sm text-gray-600">If the customer wants to cancel this order, you can cancel it here. This action cannot be undone.</p>
                                    <CancelOrderButton orderId={order.id} />
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}