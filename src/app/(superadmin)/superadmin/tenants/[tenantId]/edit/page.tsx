// src/app/(superadmin)/superadmin/tenants/[tenantId]/edit/page.tsx

import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { updateTenant } from './actions';
import { Role } from '@prisma/client';

interface EditTenantPageProps {
  params: { tenantId: string };
}

export default async function EditTenantPage({ params }: EditTenantPageProps) {
  const { tenantId } = params;

  // Fetch the tenant AND its admin user
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        where: { role: Role.ADMIN }, // Find the user with the ADMIN role for this tenant
        take: 1, // There should only be one
      }
    }
  });

  if (!tenant || tenant.users.length === 0) {
    notFound();
  }

  const adminUser = tenant.users[0];

  // Bind the necessary IDs to the server action
  const updateTenantWithIds = updateTenant.bind(null, tenant.id, adminUser.id);

  return (
    <div className="rounded-lg bg-gray-800/80 p-6 sm:p-8 ring-1 ring-white/10">
      <h2 className="text-2xl font-bold leading-7 text-white">
        Edit Tenant: {tenant.name}
      </h2>
      <p className="mt-1 text-sm leading-6 text-gray-300">
        Update the tenant's details below.
      </p>

      <form action={updateTenantWithIds} className="mt-8 max-w-xl">
        <div className="space-y-6">
          {/* Tenant Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-200">
              Tenant Name
            </label>
            <div className="mt-2">
              <input type="text" name="name" id="name" defaultValue={tenant.name}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                required />
            </div>
          </div>

          {/* Tenant Admin Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-200">
              Tenant Admin Email
            </label>
            <div className="mt-2">
              <input type="email" name="email" id="email" defaultValue={adminUser.email}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                required />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" className="text-sm font-semibold leading-6 text-gray-300">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}