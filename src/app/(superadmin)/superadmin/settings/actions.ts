// src/app/(superadmin)/superadmin/settings/actions.ts

'use server';

import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// --- Action to create a new super admin ---
const CreateAdminSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  tenantId: z.string(), // Now passed from a hidden form field
});

// The signature is changed to the standard for useActionState
export async function createNewSuperAdmin(prevState: any, formData: FormData) {
  const validatedFields = CreateAdminSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { status: 'error', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { name, email, password, tenantId } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { status: 'error', message: 'A user with this email already exists.' };
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role: Role.SUPER_ADMIN, tenantId }
    });

    revalidatePath('/superadmin/settings');
    return { status: 'success', message: `Admin '${name}' created successfully!` };
  } catch (error) {
    return { status: 'error', message: 'Database error: Failed to create admin.' };
  }
}

// --- Action to update the current super admin's password ---
const UpdatePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
});

// The signature is changed to the standard for useActionState
export async function updateSuperAdminPassword(prevState: any, formData: FormData) {
  const validatedFields = UpdatePasswordSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { status: 'error', errors: validatedFields.error.flatten().fieldErrors };
  }

  const { userId, currentPassword, newPassword } = validatedFields.data;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { return { status: 'error', message: "User not found." }; }

    const passwordsMatch = await compare(currentPassword, user.password);
    if (!passwordsMatch) { return { status: 'error', message: "Incorrect current password." }; }

    const hashedNewPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
    
    return { status: 'success', message: 'Password updated successfully!' };
  } catch (error) {
    return { status: 'error', message: 'Database error: Failed to update password.' };
  }
}