// src/app/(superadmin)/superadmin/create/create-tenant-form.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createTenant } from './actions';
import { Tenant } from '@prisma/client';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50">
      {pending ? 'Creating...' : 'Create Tenant'}
    </button>
  );
}

// The form now accepts the list of tenants as a prop
export function CreateTenantForm({ tenants }: { tenants: Tenant[] }) {
  const [state, dispatch] = useFormState(createTenant, undefined);

  return (
    <form action={dispatch} className="mt-8 max-w-xl">
      <div className="space-y-8">
        <div className="border-b border-white/10 pb-8">
          <h3 className="text-base font-semibold leading-7 text-white">Tenant Information</h3>
          <div className="mt-4">
            <label htmlFor="tenantName" className="block text-sm font-medium leading-6 text-gray-200">Internal Tenant Name</label>
            <input type="text" name="tenantName" id="tenantName" className="mt-2 block w-full rounded-md bg-white/5 py-1.5 text-white ring-1 ring-inset ring-white/10" required />
            {state?.errors?.tenantName && <p className="mt-2 text-sm text-red-400">{state.errors.tenantName}</p>}
          </div>
          
          {/* --- NEW REFERRAL DROPDOWN --- */}
          <div className="mt-4">
            <label htmlFor="referredById" className="block text-sm font-medium leading-6 text-gray-200">Referred By (Optional)</label>
            <select name="referredById" id="referredById" className="mt-2 block w-full rounded-md bg-gray-800 py-1.5 text-white ring-1 ring-inset ring-white/10">
              <option value="">None</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-b border-white/10 pb-8">
          <h3 className="text-base font-semibold leading-7 text-white">Tenant Admin User</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6">
             <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-200">Admin Name</label>
                <input type="text" name="adminName" id="adminName" className="mt-2 block w-full rounded-md bg-gray-800 py-1.5 text-white ring-1 ring-inset ring-white/10" required />
                {state?.errors?.adminName && <p className="mt-2 text-sm text-red-400">{state.errors.adminName}</p>}
             </div>
             <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-200">Admin Email</label>
                <input type="email" name="adminEmail" id="adminEmail" className="mt-2 block w-full rounded-md bg-gray-800 py-1.5 text-white ring-1 ring-inset ring-white/10" required />
                {state?.errors?.adminEmail && <p className="mt-2 text-sm text-red-400">{state.errors.adminEmail}</p>}
             </div>
             <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-200">Admin Password</label>
                <input type="password" name="adminPassword" id="adminPassword" className="mt-2 block w-full rounded-md bg-gray-800 py-1.5 text-white ring-1 ring-inset ring-white/10" required />
                {state?.errors?.adminPassword && <p className="mt-2 text-sm text-red-400">{state.errors.adminPassword}</p>}
             </div>
          </div>
        </div>
        {state?.message && <p className="mt-2 text-sm text-red-400">{state.message}</p>}
      </div>
      <div className="mt-6 flex items-center justify-end gap-x-6">
        <SubmitButton />
      </div>
    </form>
  );
}