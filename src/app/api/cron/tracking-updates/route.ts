import { PrismaClient, OrderStatus, ShippingProvider } from '@prisma/client';
import { NextResponse } from 'next/server';
import { FardaExpressService } from '@/lib/shipping/farda-express';
import { TransExpressProvider } from '@/lib/shipping/trans-express';
import { RoyalExpressProvider } from '@/lib/shipping/royal-express';
import { ShipmentStatus } from '@/lib/shipping/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Map ShipmentStatus to OrderStatus
const statusMap: Record<ShipmentStatus, OrderStatus> = {
    [ShipmentStatus.PENDING]: OrderStatus.SHIPPED,
    [ShipmentStatus.IN_TRANSIT]: OrderStatus.SHIPPED,
    [ShipmentStatus.OUT_FOR_DELIVERY]: OrderStatus.SHIPPED,
    [ShipmentStatus.DELIVERED]: OrderStatus.DELIVERED,
    [ShipmentStatus.EXCEPTION]: OrderStatus.SHIPPED
};

// This endpoint will be called by a cron job every hour
export async function GET(request: Request) {
    try {
        // Verify the request is from our cron service
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get all orders that are shipped but not delivered
        const orders = await prisma.order.findMany({
            where: {
                status: OrderStatus.SHIPPED,
                shippingProvider: { not: null },
                trackingNumber: { not: null },
                deliveredAt: null,
            },
            select: {
                id: true,
                shippingProvider: true,
                trackingNumber: true,
                status: true,
                customerPhone: true,
                customerEmail: true,
                tenantId: true,
                tenant: {
                    select: {
                        fardaExpressClientId: true,
                        fardaExpressApiKey: true,
                        transExpressApiKey: true,
                        royalExpressApiKey: true,
                    },
                },
            },
        });

        console.log(`Found ${orders.length} orders to check for updates`);

        const updates = await Promise.all(
            orders.map(async (order) => {
                try {
                    if (order.shippingProvider === ShippingProvider.FARDA_EXPRESS) {
                        const fardaClientId = order.tenant?.fardaExpressClientId;
                        const fardaApiKey = order.tenant?.fardaExpressApiKey;

                        if (!fardaClientId || !fardaApiKey) {
                            console.warn(`Farda Express credentials missing for tenant ${order.tenantId}`);
                            return {
                                orderId: order.id,
                                success: false,
                                error: 'Farda Express credentials missing',
                            };
                        }
                        const fardaService = new FardaExpressService(fardaClientId, fardaApiKey);
                        const shipmentStatus = await fardaService.trackShipment(order.trackingNumber!);

                        // Update order status
                        const updatedOrder = await prisma.order.update({
                            where: { id: order.id },
                            data: {
                                status: statusMap[shipmentStatus],
                                deliveredAt: shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
                                trackingUpdates: {
                                    create: {
                                        status: shipmentStatus,
                                        timestamp: new Date(),
                                        tenantId: order.tenantId,
                                    },
                                },
                            },
                        });

                        return {
                            orderId: order.id,
                            success: true,
                            newStatus: shipmentStatus,
                        };
                    } else if (order.shippingProvider === ShippingProvider.TRANS_EXPRESS) {
                        try {
                            const transApiKey = order.tenant?.transExpressApiKey;

                            if (!transApiKey) {
                                console.warn(`Trans Express API key missing for tenant ${order.tenantId}`);
                                return {
                                    orderId: order.id,
                                    success: false,
                                    error: 'Trans Express API key missing',
                                };
                            }

                            const transExpressService = new TransExpressProvider(transApiKey);
                            const shipmentStatus = await transExpressService.trackShipment(order.trackingNumber!);

                            // Update order status
                            const updatedOrder = await prisma.order.update({
                                where: { id: order.id },
                                data: {
                                    status: statusMap[shipmentStatus],
                                    deliveredAt: shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
                                    trackingUpdates: {
                                        create: {
                                            status: shipmentStatus,
                                            timestamp: new Date(),
                                            tenantId: order.tenantId,
                                        },
                                    },
                                },
                            });

                            return {
                                orderId: order.id,
                                success: true,
                                newStatus: shipmentStatus,
                            };
                        } catch (error) {
                            console.error(`Error updating Trans Express tracking for order ${order.id}:`, error);
                            return {
                                orderId: order.id,
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown Trans Express tracking error',
                            };
                        }
                    } else if (order.shippingProvider === ShippingProvider.ROYAL_EXPRESS) {
                        try {
                            const royalApiKey = order.tenant?.royalExpressApiKey;

                            if (!royalApiKey) {
                                console.warn(`Royal Express API key missing for tenant ${order.tenantId}`);
                                return {
                                    orderId: order.id,
                                    success: false,
                                    error: 'Royal Express API key not configured',
                                };
                            }

                            const [royalEmail, royalPassword] = royalApiKey.split(':');
                            if (!royalEmail || !royalPassword) {
                                console.warn(`Royal Express API key format invalid for tenant ${order.tenantId}`);
                                return {
                                    orderId: order.id,
                                    success: false,
                                    error: 'Royal Express API key format invalid (expected email:password)',
                                };
                            }

                            const royalExpressService = new RoyalExpressProvider(royalEmail, royalPassword);
                            const shipmentStatus = await royalExpressService.trackShipment(order.trackingNumber!);

                            // Update order status
                            const updatedOrder = await prisma.order.update({
                                where: { id: order.id },
                                data: {
                                    status: statusMap[shipmentStatus],
                                    deliveredAt: shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
                                    trackingUpdates: {
                                        create: {
                                            status: shipmentStatus,
                                            timestamp: new Date(),
                                            tenantId: order.tenantId,
                                        },
                                    },
                                },
                            });

                            return {
                                orderId: order.id,
                                success: true,
                                newStatus: shipmentStatus,
                            };
                        } catch (error) {
                            console.error(`Error updating Royal Express tracking for order ${order.id}:`, error);
                            return {
                                orderId: order.id,
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown Royal Express tracking error',
                            };
                        }
                    }

                    // Handle other shipping providers here
                    return {
                        orderId: order.id,
                        success: false,
                        error: 'Unsupported shipping provider',
                    };
                } catch (error) {
                    console.error(`Error updating order ${order.id}:`, error);
                    return {
                        orderId: order.id,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        return NextResponse.json({
            processed: orders.length,
            updates,
        });
    } catch (error) {
        console.error('Error processing tracking updates:', error);
        return NextResponse.json(
            { error: 'Failed to process tracking updates' },
            { status: 500 }
        );
    }
}