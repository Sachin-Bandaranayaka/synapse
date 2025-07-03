// src/app/(superadmin)/superadmin/create/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Zod schema now includes the optional referredById
const CreateTenantSchema = z.object({
  tenantName: z.string().min(3, 'Tenant name must be at least 3 characters.'),
  adminName: z.string().min(3, 'Admin name must be at least 3 characters.'),
  adminEmail: z.string().email('Invalid email address.'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters.'),
  referredById: z.string().optional(), // New optional field
});

export async function createTenant(prevState: any, formData: FormData) {
  const validatedFields = CreateTenantSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { tenantName, adminName, adminEmail, adminPassword, referredById } = validatedFields.data;

  try {
    const emailExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (emailExists) {
      return { message: 'A user with this email already exists.' };
    }
    
    const hashedPassword = await hash(adminPassword, 12);
    
    await prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: tenantName,
          // Conditionally connect the referrer if one was selected
          ...(referredById && {
            referredBy: {
              connect: { id: referredById }
            }
          })
        },
      });

      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN,
          tenantId: newTenant.id,
        },
      });
    });

  } catch (error) {
    return { message: 'Database Error: Failed to create tenant.' };
  }

  revalidatePath('/superadmin/users');
  redirect('/superadmin/users');
}