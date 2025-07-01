import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Parser } from 'json2csv';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: { operation: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        switch (params.operation) {
            case 'update-stock':
                return handleStockUpdate(session.user.id, session.user.tenantId);
            case 'export-csv':
                return handleExportCsv();
            case 'check-low-stock':
                return handleLowStockCheck();
            default:
                return NextResponse.json(
                    { error: 'Invalid operation' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in bulk operation:', error);
        return NextResponse.json(
            { error: 'Failed to perform bulk operation' },
            { status: 500 }
        );
    }
}

async function handleStockUpdate(userId: string, tenantId: string) {
    try {
        // Get all products with their current stock and low stock alert levels
        const products = await prisma.product.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                stock: true,
                lowStockAlert: true,
            },
        });

        // Simulate stock update (in real app, this would sync with external inventory system)
        const updates = await Promise.all(
            products.map(async (product) => {
                // Random stock adjustment between -5 and +10
                const adjustment = Math.floor(Math.random() * 16) - 5;
                const newStock = Math.max(0, product.stock + adjustment);

                return prisma.product.update({
                    where: { id: product.id },
                    data: {
                        stock: newStock,
                        stockAdjustments: {
                                    create: {
                                        quantity: adjustment,
                                        reason: 'Bulk stock update',
                                        previousStock: product.stock,
                                        newStock: newStock,
                                        tenant: {
                                            connect: { id: tenantId },
                                        },
                                        adjustedBy: {
                                            connect: { id: userId },
                                        },
                                    },
                                },
                    },
                });
            })
        );

        return NextResponse.json({
            message: 'Stock levels updated successfully',
            updatedProducts: updates.length,
        });
    } catch (error) {
        console.error('Error updating stock levels:', error);
        return NextResponse.json(
            { error: 'Failed to update stock levels' },
            { status: 500 }
        );
    }
}

async function handleExportCsv() {
    try {
        const products = await prisma.product.findMany({
            include: {
                _count: {
                    select: {
                        orders: true,
                        leads: true,
                    },
                },
                stockAdjustments: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });

        const fields = [
            { label: 'Code', value: 'code' },
            { label: 'Name', value: 'name' },
            { label: 'Description', value: 'description' },
            { label: 'Price', value: 'price' },
            { label: 'Current Stock', value: 'stock' },
            { label: 'Low Stock Alert', value: 'lowStockAlert' },
            { label: 'Total Orders', value: '_count.orders' },
            { label: 'Total Leads', value: '_count.leads' },
            { label: 'Last Updated', value: 'updatedAt' },
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(products);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=products.csv',
            },
        });
    } catch (error) {
        console.error('Error exporting products:', error);
        return NextResponse.json(
            { error: 'Failed to export products' },
            { status: 500 }
        );
    }
}

async function handleLowStockCheck() {
    try {
        const lowStockProducts = await prisma.product.findMany({
            where: {
                stock: {
                    lte: prisma.product.fields.lowStockAlert,
                },
            },
            include: {
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
            orderBy: {
                stock: 'asc',
            },
        });

        const report = lowStockProducts.map(product => ({
            code: product.code,
            name: product.name,
            currentStock: product.stock,
            lowStockAlert: product.lowStockAlert,
            monthlyOrders: product._count.orders,
            status: product.stock === 0 ? 'Out of Stock' : 'Low Stock',
            reorderQuantity: Math.max(
                product.lowStockAlert * 2,
                Math.ceil(product._count.orders * 1.5)
            ),
        }));

        return NextResponse.json({
            totalProducts: report.length,
            outOfStock: report.filter(p => p.status === 'Out of Stock').length,
            lowStock: report.filter(p => p.status === 'Low Stock').length,
            products: report,
        });
    } catch (error) {
        console.error('Error checking low stock:', error);
        return NextResponse.json(
            { error: 'Failed to check low stock' },
            { status: 500 }
        );
    }
} 