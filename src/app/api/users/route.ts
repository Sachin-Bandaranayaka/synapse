// src/app/api/users/route.ts

import { getScopedPrismaClient } from '@/lib/prisma'; // Import our scoped client
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'TEAM_MEMBER']),
  permissions: z.array(z.string()),
});

// SECURED GET HANDLER
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Use the scoped client to fetch users for the current tenant only
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true, leads: true }
        }
      }
    });

    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      totalOrders: user._count.orders,
      totalLeads: user._count.leads
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// SECURED POST HANDLER
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Use the scoped client
    const prisma = getScopedPrismaClient(session.user.tenantId);

    const data = await request.json();
    const validatedData = UserSchema.parse(data);

    // Check if user already exists within this tenant's scope
    const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email }
    });

    if (existingUser) {
        return NextResponse.json({ error: 'User with this email already exists in your organization.' }, { status: 400 });
    }

    const hashedPassword = await hash(validatedData.password, 12);

    // This create operation is now secure. The scoped client will automatically
    // add the correct tenantId to the new user.
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        permissions: validatedData.permissions,
        tenant: {
          connect: { id: session.user.tenantId },
        },
      },
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
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid data provided', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}