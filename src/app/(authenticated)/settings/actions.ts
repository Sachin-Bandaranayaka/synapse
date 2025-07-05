'use server';

import { getSession } from '@/lib/auth';
// --- FIX: Import the global prisma client, not the scoped one ---
import { prisma } from '@/lib/prisma'; 
import { revalidatePath } from 'next/cache';

export async function updateTenantSettings(
  prevState: { message: string, status: 'error' | 'success' } | undefined,
  formData: FormData
) {
  const session = await getSession();

  // The authorization check remains the same
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    return { status: 'error', message: 'Unauthorized' };
  }

  const dataToUpdate = {
    businessName: formData.get('businessName') as string,
    businessAddress: formData.get('businessAddress') as string,
    businessPhone: formData.get('businessPhone') as string,
    invoicePrefix: formData.get('invoicePrefix') as string,
    fardaExpressClientId: formData.get('fardaExpressClientId') as string,
    fardaExpressApiKey: formData.get('fardaExpressApiKey') as string,
    transExpressUsername: formData.get('transExpressUsername') as string,
    transExpressPassword: formData.get('transExpressPassword') as string,
    royalExpressApiKey: formData.get('royalExpressApiKey') as string,
  };
  
  try {
    // --- FIX: We are now using the global 'prisma' client directly ---
    // This bypasses the getScopedPrismaClient function and prevents the extra
    // 'tenantId' from being added to the 'where' clause.
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    return { status: 'error', message: `Failed to update settings: ${errorMessage}` };
  }
}