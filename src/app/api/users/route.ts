// src/app/api/users/route.ts

import { getScopedPrismaClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { Role, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  permissions: z.array(z.string()),
});

// GET handler remains the same
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);

    const users = await prisma.user.findMany({
      where: { isActive: true }, // Only show active users
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true, permissions: true,
        _count: { select: { orders: true, leads: true } }
      }
    });

    return NextResponse.json(users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      totalOrders: user._count.orders,
      totalLeads: user._count.leads
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// --- FIX: SECURED POST HANDLER WITH "UPSERT" LOGIC ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);
    const data = await request.json();
    const validatedData = UserSchema.parse(data);

    // Find if a user exists with this email, regardless of active status
    const existingUser = await prisma.user.findFirst({
        where: { email: validatedData.email }
    });

    const hashedPassword = await hash(validatedData.password, 12);
    let user;

    if (existingUser) {
        // If the user exists but is INACTIVE, reactivate and update them.
        if (!existingUser.isActive) {
            user = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    name: validatedData.name,
                    password: hashedPassword,
                    role: validatedData.role,
                    permissions: validatedData.permissions,
                    isActive: true, // Reactivate the user
                }
            });
        } else {
            // If the user exists and is ACTIVE, return an error.
            return NextResponse.json({ error: 'An active user with this email already exists.' }, { status: 400 });
        }
    } else {
        // If no user exists, create a new one.
        user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                password: hashedPassword,
                role: validatedData.role,
                permissions: validatedData.permissions,
                isActive: true,
                tenant: {
                    connect: { id: session.user.tenantId },
                },
            },
        });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid data provided', details: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
