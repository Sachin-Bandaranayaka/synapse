import { getScopedPrismaClient, prisma as globalPrisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { ShippingForm } from '@/components/orders/shipping-form';
import { OrderJourney } from '@/components/orders/order-journey';
import { Invoice } from '@/components/orders/invoice';
import { PrintButton } from '@/components/orders/print-button';
import { CancelOrderButton } from '@/components/orders/cancel-order-button';
import { ProfitBreakdownCard } from '@/components/orders/profit-breakdown';
import { OrderActions } from '@/components/orders/order-actions';

interface OrderDetailsPageProps {
    params: Promise<{
        orderId: string;
    }>;
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }

    const resolvedParams = await params;
    const scopedPrisma = getScopedPrismaClient(session.user.tenantId);

    const [order, tenant] = await Promise.all([
        scopedPrisma.order.findUnique({
            where: { id: resolvedParams.orderId },
            include: {
                product: true,
                lead: true,
                assignedTo: true,
                trackingUpdates: { orderBy: { timestamp: 'desc' } },
            },
        }),
        globalPrisma.tenant.findUnique({
            where: { id: session.user.tenantId }
        })
    ]);

    if (!order || !tenant) {
        return notFound();
    }

    const canUpdateShipping = session.user.role === 'ADMIN' || session.user.permissions?.includes('UPDATE_SHIPPING_STATUS');
    const canDeleteOrders = session.user.role === 'ADMIN' || session.user.permissions?.includes('DELETE_ORDERS');
    const invoiceNumber = `${tenant.invoicePrefix || 'INV'}-${order.number}`;

    return (
        <>
            {/* --- FIX: Section 1 - For Screen View Only --- */}
            {/* This entire div will be hidden when printing */}
            <div className="print:hidden p-4 sm:p-6 lg:p-8">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h1 className="text-xl sm:text-2xl font-semibold text-white">Order Details</h1>
                        <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${order.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300'}`}>
                                {order.status.toLowerCase()}
                            </span>
                            <PrintButton />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        {/* This is the invoice displayed on the screen */}
                        <div className="order-2 xl:order-1">
                            <h2 className="font-semibold text-xl mb-6 text-white">Invoice Preview</h2>
                            <div className="bg-white text-black p-2 sm:p-4 rounded-md overflow-x-auto">
                                <Invoice
                                    businessName={tenant.businessName}
                                    businessAddress={tenant.businessAddress}
                                    businessPhone={tenant.businessPhone}
                                    invoiceNumber={invoiceNumber}
                                    order={order}
                                    showPrintControls={true}
                                />
                            </div>
                        </div>

                        {/* Other components like Order Journey, Shipping Form, etc. */}
                        <div className="order-1 xl:order-2 flex flex-col gap-6">

                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && canUpdateShipping && (
                                <div className="print:hidden rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                                    <div className="px-4 sm:px-6 py-4 sm:py-5"><h3 className="text-lg font-medium text-white">Shipping Information</h3></div>
                                    <div className="border-t border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
                                        <ShippingForm
                                            orderId={order.id}
                                            currentProvider={order.shippingProvider || undefined}
                                            currentTrackingNumber={order.trackingNumber || undefined}
                                            order={{
                                                customerName: order.customerName,
                                                customerPhone: order.customerPhone,
                                                customerSecondPhone: order.customerSecondPhone || undefined,
                                                customerAddress: order.customerAddress,
                                                product: { name: order.product.name, price: order.product.price, },
                                                quantity: order.quantity,
                                                discount: order.discount || undefined,
                                            }}
                                            fardaExpressClientId={tenant.fardaExpressClientId || undefined}
                                            fardaExpressApiKey={tenant.fardaExpressApiKey || undefined}
                                            transExpressApiKey={tenant.transExpressApiKey || undefined}
                                            royalExpressApiKey={tenant.royalExpressApiKey || undefined}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Profit Breakdown */}
                            <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                                <div className="px-4 sm:px-6 py-4 sm:py-5"><h3 className="text-lg font-medium text-white">Profit Analysis</h3></div>
                                <div className="border-t border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
                                    <ProfitBreakdownCard orderId={order.id} showDetails={true} />
                                </div>
                            </div>

                            {/* Order Actions & Cost Management */}
                            <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                                <div className="px-4 sm:px-6 py-4 sm:py-5"><h3 className="text-lg font-medium text-white">Order Management</h3></div>
                                <div className="border-t border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
                                    <OrderActions order={order} user={session.user} />
                                </div>
                            </div>

                            <div className="rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                                <div className="px-4 sm:px-6 py-4 sm:py-5"><h3 className="text-lg font-medium text-white">Order Journey</h3></div>
                                <div className="border-t border-gray-700 px-4 sm:px-6 py-4 sm:py-5"><OrderJourney order={order} /></div>
                            </div>
                            {order.status === 'CONFIRMED' && canDeleteOrders && (
                                <div className="print:hidden rounded-lg bg-gray-800 overflow-hidden ring-1 ring-white/10">
                                    <div className="px-4 sm:px-6 py-4 sm:py-5"><h3 className="text-lg font-medium text-white">Cancel Order</h3></div>
                                    <div className="border-t border-gray-700 px-4 sm:px-6 py-4 sm:py-5">
                                        <div className="flex flex-col space-y-4">
                                            <p className="text-sm text-gray-400">If the customer wants to cancel this order, you can do so here. This action cannot be undone.</p>
                                            <CancelOrderButton orderId={order.id} orderStatus={order.status} />
                                        </div>
                                    </div>
                                </div>
                            )}                        </div>
                    </div>
                </div>
            </div>

            {/* --- FIX: Section 2 - For Print View Only --- */}
            {/* This div is hidden on screen but becomes the only visible thing when printing */}
            <div className="hidden print:block">
                <Invoice
                    businessName={tenant.businessName}
                    businessAddress={tenant.businessAddress}
                    businessPhone={tenant.businessPhone}
                    invoiceNumber={invoiceNumber}
                    order={order}
                    showPrintControls={false} // Hide the "Mark as Printed" button on the paper copy
                />
            </div>
        </>
    );
}