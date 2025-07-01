// src/app/(superadmin)/superadmin/page.tsx

import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import React from 'react';
import { toggleTenantStatus } from './actions'; // <-- Import our new Server Action

async function SuperAdminDashboardPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-6 text-gray-900">
            Super Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            A list of all the tenant accounts in your system.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/superadmin/create"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create Tenant
          </Link>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Name</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date Created</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{tenant.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {tenant.isActive ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Inactive</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      {/* --- ACTION BUTTONS ADDED HERE --- */}
                      <div className="flex items-center justify-end gap-x-4">
                        <Link href={`/superadmin/tenants/${tenant.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          Edit
                        </Link>
                        <form action={toggleTenantStatus}>
                          <input type="hidden" name="tenantId" value={tenant.id} />
                          <input type="hidden" name="isActive" value={String(tenant.isActive)} />
                          <button type="submit" className={tenant.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}>
                            {tenant.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboardPage;