// src/app/(superadmin)/superadmin/create/page.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createTenant } from './actions';

// A helper component to show a pending state on the button
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
    >
      {pending ? 'Creating...' : 'Create Tenant'}
    </button>
  );
}

export default function CreateTenantPage() {
  // useFormState hook to handle form state and errors
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createTenant, initialState);

  return (
    <form action={dispatch} className="m-8 max-w-xl">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-white">Create a New Tenant</h2>
          <p className="mt-1 text-sm leading-6 text-gray-300">
            This will create a new tenant account and an initial admin user for that tenant.
          </p>
        </div>

        <div className="border-b border-gray-900/10 pb-8">
          <h3 className="text-base font-semibold leading-7 text-gray-300">Tenant Information</h3>
          <div className="mt-4">
            <label htmlFor="tenantName" className="block text-sm font-medium leading-6 text-gray-300">Tenant Name</label>
            <input type="text" name="tenantName" id="tenantName" className="mt-2 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600" required />
            {state.errors?.tenantName && <p className="mt-2 text-sm text-red-500">{state.errors.tenantName}</p>}
          </div>
        </div>

        <div className="border-b border-gray-900/10 pb-8">
          <h3 className="text-base font-semibold leading-7 text-gray-300">Tenant Admin User</h3>
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium leading-6 text-gray-300">Admin Name</label>
              <input type="text" name="adminName" id="adminName" className="mt-2 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" required />
              {state.errors?.adminName && <p className="mt-2 text-sm text-red-500">{state.errors.adminName}</p>}
            </div>
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium leading-6 text-gray-300">Admin Email</label>
              <input type="email" name="adminEmail" id="adminEmail" className="mt-2 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" required />
              {state.errors?.adminEmail && <p className="mt-2 text-sm text-red-500">{state.errors.adminEmail}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="adminPassword" className="block text-sm font-medium leading-6 text-gray-300">Admin Password</label>
              <input type="password" name="adminPassword" id="adminPassword" className="mt-2 block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300" required />
              {state.errors?.adminPassword && <p className="mt-2 text-sm text-red-500">{state.errors.adminPassword}</p>}
            </div>
          </div>
        </div>
        {state.message && <p className="mt-2 text-sm text-red-500">{state.message}</p>}
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <SubmitButton />
      </div>
    </form>
  );
}