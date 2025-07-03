// src/app/(authenticated)/settings/actions.ts

'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SettingsSchema = z.object({
  businessName: z.string().optional(),
  logoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  backgroundColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
  cardColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
  fontColor: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, { message: "Must be a valid hex color code."}).optional().or(z.literal('')),
  // API keys
  fardaExpressClientId: z.string().optional(),
  fardaExpressApiKey: z.string().optional(),
  transExpressUsername: z.string().optional(),
  transExpressPassword: z.string().optional(),
  royalExpressApiKey: z.string().optional(),
});

export async function updateTenantSettings(prevState: any, formData: FormData) {
  const session = await getSession();
  if (!session?.user?.tenantId) {
    return { status: 'error', message: 'Unauthorized' };
  }

  const validatedFields = SettingsSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { status: 'error', errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        businessName: validatedFields.data.businessName || null,
        logoUrl: validatedFields.data.logoUrl || null,
        backgroundColor: validatedFields.data.backgroundColor || null,
        cardColor: validatedFields.data.cardColor || null,
        fontColor: validatedFields.data.fontColor || null,
        fardaExpressClientId: validatedFields.data.fardaExpressClientId || null,
        fardaExpressApiKey: validatedFields.data.fardaExpressApiKey || null,
        transExpressUsername: validatedFields.data.transExpressUsername || null,
        transExpressPassword: validatedFields.data.transExpressPassword || null,
        royalExpressApiKey: validatedFields.data.royalExpressApiKey || null,
      },
    });

    revalidatePath('/settings');
    return { status: 'success', message: 'Settings updated successfully!' };
  } catch (error) {
    return { status: 'error', message: 'Database error: Failed to update settings.' };
  }
}