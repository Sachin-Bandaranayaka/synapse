import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      businessName,
      businessAddress,
      businessPhone,
      invoicePrefix,
      defaultShippingProvider,
      backgroundColor,
      cardColor,
      fontColor,
      adminName,
      adminEmail,
      adminPassword
    } = body;

    // Validate required fields
    if (!name || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Name, admin name, admin email, and admin password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if tenant name already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { name },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant name already exists' },
        { status: 400 }
      );
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Admin email already exists' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          name,
          businessName: businessName || null,
          businessAddress: businessAddress || null,
          businessPhone: businessPhone || null,
          invoicePrefix: invoicePrefix || null,
          defaultShippingProvider: defaultShippingProvider || 'FARDA_EXPRESS',
          backgroundColor: backgroundColor || '#1f2937',
          cardColor: cardColor || '#374151',
          fontColor: fontColor || '#ffffff',
          isActive: true,
        },
      });

      // Create the admin user
      const adminUser = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
          isActive: true,
        },
      });

      return { tenant, adminUser };
    });

    // Return tenant data without sensitive information
    const { tenant } = result;
    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      businessName: tenant.businessName,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      message: 'Tenant and admin user created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}