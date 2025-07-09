// src/app/(authenticated)/settings/actions.ts

'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// --- FIX: Import the ShippingProvider enum for validation ---
import { ShippingProvider } from '@prisma/client';
import { z } from 'zod';

// --- NEW: Define a schema to validate the form data ---
const settingsSchema = z.object({
    businessName: z.string().optional(),
    businessAddress: z.string().optional(),
    businessPhone: z.string().optional(),
    invoicePrefix: z.string().optional(),
    defaultShippingProvider: z.nativeEnum(ShippingProvider).optional(),
    fardaExpressClientId: z.string().optional(),
    fardaExpressApiKey: z.string().optional(),
    transExpressUsername: z.string().optional(),
    transExpressPassword: z.string().optional(),
    royalExpressApiKey: z.string().optional(),
});


export async function updateTenantSettings(
  prevState: { message: string, status: 'error' | 'success' } | undefined,
  formData: FormData
) {
  const session = await getSession();

  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    return { status: 'error', message: 'Unauthorized' };
  }

  // --- FIX: Create a plain object from formData for validation ---
  const formValues = Object.fromEntries(formData.entries());

  try {
    // Validate the form data against the schema
    const validatedData = settingsSchema.parse(formValues);
    
    // Filter out any empty API key fields so they don't overwrite existing keys with an empty string
    const dataToUpdate: Partial<typeof validatedData> = { ...validatedData };
    if (!dataToUpdate.fardaExpressApiKey) delete dataToUpdate.fardaExpressApiKey;
    if (!dataToUpdate.transExpressPassword) delete dataToUpdate.transExpressPassword;
    if (!dataToUpdate.royalExpressApiKey) delete dataToUpdate.royalExpressApiKey;


    await prisma.tenant.update({
      where: {
        id: session.user.tenantId, 
      },
      data: dataToUpdate,
    });

    revalidatePath('/settings');
    return { status: 'success', message: 'Settings updated successfully.' };

  } catch (error) {
    console.error('Error updating tenant settings:', error);
    
    if (error instanceof z.ZodError) {
        return { status: 'error', message: `Invalid data: ${error.errors.map(e => e.message).join(', ')}` };
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return { status: 'error', message: `Failed to update settings: ${errorMessage}` };
  }
}
