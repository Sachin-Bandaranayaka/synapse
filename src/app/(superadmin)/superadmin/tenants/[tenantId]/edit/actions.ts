// src/app/(superadmin)/superadmin/tenants/[tenantId]/edit/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Zod schema now includes email
const UpdateTenantSchema = z.object({
  name: z.string().min(3, 'Tenant name must be at least 3 characters.'),
  email: z.string().email('Please enter a valid email address.'),
});

// Server action to update the tenant and its admin user
export async function updateTenant(tenantId: string, adminUserId: string, formData: FormData) {
  const validatedFields = UpdateTenantSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // This was the fix for the typo. It's now `validatedFields`.
  const { name, email } = validatedFields.data;

  try {
    // Use a transaction to update both the tenant and the user safely
    await prisma.$transaction([
      prisma.tenant.update({
        where: { id: tenantId },
        data: { name },
      }),
      prisma.user.update({
        where: { id: adminUserId },
        data: { email },
      })
    ]);
  } catch (error) {
    // This will catch errors like a duplicate email address
    if ((error as any).code === 'P2002') {
        return { message: 'This email address is already in use by another account.' };
    }
    return { message: 'Database Error: Failed to update tenant.' };
  }

  revalidatePath('/superadmin');
  redirect('/superadmin');
}