import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const data = await request.json();
        const updateData: any = {
            name: data.name,
            role: data.role,
            permissions: data.permissions,
        };

        // Only update password if provided
        if (data.password) {
            updateData.password = await hash(data.password, 12);
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Prevent deleting the last admin
        const adminCount = await prisma.user.count({
            where: { role: 'ADMIN' }
        });

        const userToDelete = await prisma.user.findUnique({
            where: { id: params.id },
            select: { role: true }
        });

        if (adminCount <= 1 && userToDelete?.role === 'ADMIN') {
            return NextResponse.json(
                { error: 'Cannot delete the last admin user' },
                { status: 400 }
            );
        }

        await prisma.user.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
} 