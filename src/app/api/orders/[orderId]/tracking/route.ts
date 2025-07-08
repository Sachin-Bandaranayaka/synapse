import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FardaExpressService } from '@/lib/shipping/farda-express';
import { TransExpressProvider } from '@/lib/shipping/trans-express';
import { RoyalExpressProvider } from '@/lib/shipping/royal-express';
import { ShipmentStatus } from '@/lib/shipping/types';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
    request: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get order with shipping details
        const order = await prisma.order.findUnique({
            where: { id: params.orderId },
            select: {
                id: true,
                status: true,
                shippingProvider: true,
                trackingNumber: true,
                customerName: true,
                customerPhone: true,
                customerEmail: true,
                shippedAt: true,
                deliveredAt: true,
                trackingUpdates: true,
                tenantId: true,
                tenant: {
                    select: {
                        fardaExpressClientId: true,
                        fardaExpressApiKey: true,
                        transExpressUsername: true,
                        transExpressPassword: true,
                        royalExpressApiKey: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (!order.trackingNumber || !order.shippingProvider) {
            return NextResponse.json(
                { error: 'No shipping information available' },
                { status: 400 }
            );
        }

        // Get tracking information based on the shipping provider
        let trackingInfo;
        if (order.shippingProvider === 'FARDA_EXPRESS') {
            const fardaClientId = order.tenant?.fardaExpressClientId;
            const fardaApiKey = order.tenant?.fardaExpressApiKey;

            if (!fardaClientId || !fardaApiKey) {
                console.error(`Farda Express credentials missing for tenant ${order.tenantId}`);
                return NextResponse.json(
                    { error: 'Farda Express credentials missing' },
                    { status: 500 }
                );
            }
            const fardaService = new FardaExpressService(fardaClientId, fardaApiKey);
            trackingInfo = await fardaService.trackShipment(order.trackingNumber);

            // Update order status based on tracking info
            const updatedOrder = await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: trackingInfo.status === 'DELIVERED' ? 'DELIVERED' : 'SHIPPED',
                    deliveredAt: trackingInfo.status === 'DELIVERED' ? new Date() : null,
                    trackingUpdates: {
                        create: {
                            status: trackingInfo.status,
                            location: trackingInfo.location,
                            description: trackingInfo.description,
                            timestamp: new Date(trackingInfo.timestamp),
                            tenantId: order.tenantId,
                        },
                    },
                },
                include: {
                    trackingUpdates: {
                        orderBy: {
                            timestamp: 'desc',
                        },
                    },
                },
            });

            // Send notification if status has changed
            if (trackingInfo.status !== order.status) {
                // TODO: Implement notification service
                // await sendTrackingUpdate({
                //   phone: order.customerPhone,
                //   email: order.customerEmail,
                //   status: trackingInfo.status,
                //   location: trackingInfo.location,
                //   description: trackingInfo.description,
                // });
            }

            return NextResponse.json(updatedOrder);
        } else if (order.shippingProvider === 'TRANS_EXPRESS') {
            try {
                const transUsername = order.tenant?.transExpressUsername;
                const transPassword = order.tenant?.transExpressPassword;

                if (!transUsername || !transPassword) {
                    console.error(`Trans Express credentials missing for tenant ${order.tenantId}`);
                    return NextResponse.json(
                        { error: 'Trans Express credentials missing' },
                        { status: 500 }
                    );
                }

                const transExpressService = new TransExpressProvider(transUsername, transPassword);
                console.log('Tracking Trans Express shipment:', order.trackingNumber);

                try {
                    const shipmentStatus = await transExpressService.trackShipment(order.trackingNumber);
                    console.log('Trans Express tracking status received:', shipmentStatus);

                    // Update order status based on tracking info
                    const updatedOrder = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            status: shipmentStatus === ShipmentStatus.DELIVERED ? 'DELIVERED' : 'SHIPPED',
                            deliveredAt: shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
                            trackingUpdates: {
                                create: {
                                    status: shipmentStatus,
                                    timestamp: new Date(),
                                    tenantId: order.tenantId,
                                },
                            },
                        },
                        include: {
                            trackingUpdates: {
                                orderBy: {
                                    timestamp: 'desc',
                                },
                            },
                        },
                    });

                    console.log('Order updated with tracking info:', updatedOrder.id);
                    return NextResponse.json(updatedOrder);
                } catch (trackingError) {
                    console.error('Error during tracking operation:', trackingError);

                    // Still update the order with pending status
                    const updatedOrder = await prisma.order.update({
                        where: { id: order.id },
                        data: {
                            trackingUpdates: {
                                create: {
                                    status: ShipmentStatus.PENDING,
                                    timestamp: new Date(),
                                    description: 'Tracking information not available yet',
                                    tenantId: order.tenantId,
                                },
                            },
                        },
                        include: {
                            trackingUpdates: {
                                orderBy: {
                                    timestamp: 'desc',
                                },
                            },
                        },
                    });

                    return NextResponse.json(updatedOrder);
                }
            } catch (error) {
                console.error('Error processing Trans Express tracking request:', error);
                return NextResponse.json(
                    { error: error instanceof Error ? error.message : 'Failed to track Trans Express shipment' },
                    { status: 500 }
                );
            }
        } else if (order.shippingProvider === 'ROYAL_EXPRESS') {
            try {
                const royalApiKey = order.tenant?.royalExpressApiKey;

                if (!royalApiKey) {
                    console.error(`Royal Express API key missing for tenant ${order.tenantId}`);
                    return NextResponse.json(
                        { error: 'Royal Express API key missing' },
                        { status: 500 }
                    );
                }

                const [royalEmail, royalPassword] = royalApiKey.split(':');
                if (!royalEmail || !royalPassword) {
                    console.error(`Royal Express API key format invalid for tenant ${order.tenantId}`);
                    return NextResponse.json(
                        { error: 'Royal Express API key format invalid (expected email:password)' },
                        { status: 500 }
                    );
                }

                const royalExpressService = new RoyalExpressProvider(royalEmail, royalPassword);
                console.log('Tracking Royal Express shipment:', order.trackingNumber);

                const shipmentStatus = await royalExpressService.trackShipment(order.trackingNumber);
                console.log('Royal Express tracking status received:', shipmentStatus);

                // Update order status based on tracking info
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: shipmentStatus === ShipmentStatus.DELIVERED ? 'DELIVERED' : 'SHIPPED',
                        deliveredAt: shipmentStatus === ShipmentStatus.DELIVERED ? new Date() : null,
                        trackingUpdates: {
                            create: {
                                status: shipmentStatus,
                                timestamp: new Date(),
                                tenantId: order.tenantId,
                            },
                        },
                    },
                    include: {
                        trackingUpdates: {
                            orderBy: {
                                timestamp: 'desc',
                            },
                        },
                    },
                });

                console.log('Order updated with tracking info:', updatedOrder.id);
                return NextResponse.json(updatedOrder);
            } catch (trackingError) {
                console.error('Error during tracking operation:', trackingError);

                // Still update the order with pending status
                const updatedOrder = await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        trackingUpdates: {
                            create: {
                                status: ShipmentStatus.PENDING,
                                timestamp: new Date(),
                                description: 'Tracking information not available yet',
                                tenantId: order.tenantId,
                            },
                        },
                    },
                    include: {
                        trackingUpdates: {
                            orderBy: {
                                timestamp: 'desc',
                            },
                        },
                    },
                });

                return NextResponse.json(updatedOrder);
            }
        }

        // Handle other shipping providers here
        return NextResponse.json(
            { error: 'Unsupported shipping provider' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error tracking shipment:', error);
        return NextResponse.json(
            { error: 'Failed to track shipment' },
            { status: 500 }
        );
    }
} 