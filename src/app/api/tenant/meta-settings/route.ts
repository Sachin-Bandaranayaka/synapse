import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getScopedPrismaClient } from '@/lib/prisma';
import { metaConversionsAPI } from '@/lib/meta-conversions-api';
import { z } from 'zod';

const metaSettingsSchema = z.object({
  metaPixelId: z.string().optional(),
  metaAccessToken: z.string().optional(),
  metaConversionsApiEnabled: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        metaPixelId: true,
        metaConversionsApiEnabled: true,
        // Don't return the access token for security
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      metaPixelId: tenant.metaPixelId || '',
      metaConversionsApiEnabled: tenant.metaConversionsApiEnabled,
      hasAccessToken: !!tenant.metaPixelId, // Indicate if token exists without exposing it
    });
  } catch (error) {
    console.error('Error fetching Meta settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = metaSettingsSchema.parse(body);

    const prisma = getScopedPrismaClient(session.user.tenantId);

    // If credentials are provided, validate them
    if (validatedData.metaPixelId && validatedData.metaAccessToken) {
      const isValid = await metaConversionsAPI.validateCredentials(
        validatedData.metaPixelId,
        validatedData.metaAccessToken
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Meta Pixel ID or Access Token' },
          { status: 400 }
        );
      }
    }

    // Update tenant settings
    const updateData: any = {
      metaConversionsApiEnabled: validatedData.metaConversionsApiEnabled,
    };

    if (validatedData.metaPixelId !== undefined) {
      updateData.metaPixelId = validatedData.metaPixelId || null;
    }

    if (validatedData.metaAccessToken !== undefined) {
      updateData.metaAccessToken = validatedData.metaAccessToken || null;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: updateData,
      select: {
        metaPixelId: true,
        metaConversionsApiEnabled: true,
      },
    });

    return NextResponse.json({
      metaPixelId: updatedTenant.metaPixelId || '',
      metaConversionsApiEnabled: updatedTenant.metaConversionsApiEnabled,
      hasAccessToken: !!updatedTenant.metaPixelId,
      message: 'Meta Conversions API settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating Meta settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const prisma = getScopedPrismaClient(session.user.tenantId);

    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        metaPixelId: null,
        metaAccessToken: null,
        metaConversionsApiEnabled: false,
      },
    });

    return NextResponse.json({
      message: 'Meta Conversions API settings cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing Meta settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}