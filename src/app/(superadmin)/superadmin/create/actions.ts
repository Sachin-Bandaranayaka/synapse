// src/app/(superadmin)/superadmin/create/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define a schema for form validation using Zod
const CreateTenantSchema = z.object({
  tenantName: z.string().min(3, 'Tenant name must be at least 3 characters.'),
  adminName: z.string().min(3, 'Admin name must be at least 3 characters.'),
  adminEmail: z.string().email('Invalid email address.'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters.'),
});

// This is the main server action
// **FIXED**: The function now correctly accepts prevState and formData
export async function createTenant(prevState: { message: string | null; errors?: any }, formData: FormData) {
  // 1. Validate the form data
  const validatedFields = CreateTenantSchema.safeParse({
    tenantName: formData.get('tenantName'),
    adminName: formData.get('adminName'),
    adminEmail: formData.get('adminEmail'),
    adminPassword: formData.get('adminPassword'),
  });

  if (!validatedFields.success) {
    // Return errors if validation fails
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: null,
    };
  }

  const { tenantName, adminName, adminEmail, adminPassword } = validatedFields.data;

  try {
    // 2. Check if a tenant or user with that email already exists
    const tenantExists = await prisma.tenant.findUnique({ where: { name: tenantName } });
    if (tenantExists) {
      return { message: 'A tenant with this name already exists.' };
    }

    const emailExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (emailExists) {
      return { message: 'A user with this email already exists.' };
    }
    
    // 3. Create the Tenant and the Admin User in a single transaction
    const hashedPassword = await hash(adminPassword, 12);
    
    await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: tenantName,
        },
      });

      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN, // Assign the 'ADMIN' role
          tenantId: newTenant.id, // Link to the new tenant
        },
      });
    });

  } catch (error) {
    return { message: 'Database Error: Failed to create tenant.' };
  }

  // 4. Revalidate the dashboard path to show the new tenant and redirect
  revalidatePath('/superadmin');
  redirect('/superadmin');
}