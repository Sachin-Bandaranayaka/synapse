import { getScopedPrismaClient } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { User } from 'next-auth'; // Import the User type

export default async function ShippingTrackingPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
        return redirect('/auth/signin');
    }
    
    const user = session.user as User;

    // --- FIX: Check for the specific VIEW_SHIPPING permission ---
    const canViewAll = user.role === 'ADMIN' || user.permissions?.includes('VIEW_SHIPPING');

    // This check is optional but recommended. If a user has no business on this page, redirect them.
    if (!canViewAll) {
        return redirect('/unauthorized');
    }

    const prisma = getScopedPrismaClient(user.tenantId);

    // --- FIX: Update the query to respect the VIEW_SHIPPING permission ---
    const where: Prisma.OrderWhereInput = {
        status: 'SHIPPED',
        shippingProvider: { not: null },
        trackingNumber: { not: null },
        // Only filter by user ID if the user is a TEAM_MEMBER AND they DON'T have permission to view all.
        ...(!canViewAll && user.role === 'TEAM_MEMBER' ? { userId: user.id } : {}),
    };

    const shippedOrders = await prisma.order.findMany({
        where,
        include: {
            product: true,
            assignedTo: true,
        },
        orderBy: {
            shippedAt: 'desc',
        },
    });

    const getTrackingUrl = (provider: string, trackingNumber: string) => {
        switch (provider) {
            case 'FARDA_EXPRESS':
                return `https://farda-express.com/track?id=${trackingNumber}`;
            case 'TRANS_EXPRESS':
                return `https://trans-express.net/track/${trackingNumber}`;
            case 'SL_POST':
                return `https://posta.lk/tracking?id=${trackingNumber}`;
            case 'ROYAL_EXPRESS':
                return `https://royal-express.lk/track/${trackingNumber}`;
            default:
                return '#';
        }
    };

    const formatProviderName = (provider: string) => {
        return provider.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-gray-900 text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Shipping Tracking</h1>
                    <p className="mt-2 text-sm text-gray-400">Track all your shipped orders in one place</p>
                </div>
            </div>

            <div className="bg-gray-800 ring-1 ring-white/10 shadow overflow-hidden rounded-lg">
                <ul className="divide-y divide-gray-700">
                    {shippedOrders.map((order) => (
                        <li key={order.id} className="hover:bg-gray-700/50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium text-indigo-400 truncate">
                                            <Link href={`/orders/${order.id}`} className="hover:text-indigo-300">
                                                Order #{order.id.slice(0, 8)}
                                            </Link>
                                        </p>
                                        <p className="mt-1 text-sm text-gray-300">
                                            {order.customerName} • {order.product.name}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-sm text-gray-400">
                                            Shipped: {format(new Date(order.shippedAt!), 'PPp')}
                                        </p>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <span className="text-sm text-gray-400">
                                                {formatProviderName(order.shippingProvider!)}
                                            </span>
                                            <a
                                                href={getTrackingUrl(order.shippingProvider!, order.trackingNumber!)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-800/50 text-indigo-300 hover:bg-indigo-800"
                                            >
                                                Track #{order.trackingNumber}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        {order.assignedTo &&
                                            <p className="flex items-center text-sm text-gray-400">
                                                Assigned to: {order.assignedTo.name}
                                            </p>
                                        }
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            {order.customerAddress}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {shippedOrders.length === 0 && (
                        <li>
                            <div className="px-4 py-8 text-center text-gray-500">
                                No shipped orders found
                            </div>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}