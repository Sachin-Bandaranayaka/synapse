// src/app/(superadmin)/superadmin/tenants/[tenantId]/edit/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const UpdateTenantSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email.'),
  businessName: z.string().optional(),
  logoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  // Add new color fields to validation
  backgroundColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
  cardColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
  fontColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
});

export async function updateTenant(tenantId: string, adminUserId: string, formData: FormData): Promise<void> {
  const validatedFields = UpdateTenantSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    throw new Error('Validation failed');
  }
  
  const { name, email, ...brandingSettings } = validatedFields.data;

  try {
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { 
          name,
          businessName: brandingSettings.businessName || null,
          logoUrl: brandingSettings.logoUrl || null,
          backgroundColor: brandingSettings.backgroundColor || null,
          cardColor: brandingSettings.cardColor || null,
          fontColor: brandingSettings.fontColor || null,
         },
      }),
      prisma.user.update({
        where: { id: adminUserId },
        data: { email },
      })
    ]);
  } catch (error) {
    if ((error as any).code === 'P2002') {
        throw new Error('This email address is already in use.');
    }
    throw new Error('Database Error: Failed to update tenant.');
  }

  revalidatePath('/superadmin/users');
  redirect('/superadmin/users');
}