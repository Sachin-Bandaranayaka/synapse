// src/app/(superadmin)/superadmin/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleTenantStatus(formData: FormData) {
  const tenantId = formData.get('tenantId') as string;
  const isActive = formData.get('isActive') === 'true';

  if (!tenantId) {
    throw new Error('Tenant ID is required.');
  }

  try {
    // We will now wrap the database call in a try...catch block
    await prisma.tenant.update({
      where: {
        id: tenantId,
      },
      data: {
        isActive: !isActive, // Flip the current status
      },
    });

    console.log(`Successfully updated tenant ${tenantId} to isActive: ${!isActive}`);

  } catch (error) {
    // If an error occurs, log it to the terminal
    console.error("Error updating tenant status:", error);
  }

  // If successful, revalidate the path to refresh the UI
  revalidatePath('/superadmin');
}