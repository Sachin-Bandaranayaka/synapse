// src/app/(authenticated)/settings/settings-form.tsx

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateTenantSettings } from './actions';
import { Tenant } from '@prisma/client';
// We are no longer importing ThemeToggleButton

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
      {pending ? 'Saving...' : 'Save Settings'}
    </button>
  );
}

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [state, dispatch] = useFormState(updateTenantSettings, undefined);

  return (
    <form action={dispatch} className="space-y-8 divide-y divide-gray-700">

      {/* Business Profile Section */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg font-medium text-white">Business Profile</h3>
          <p className="mt-1 text-sm text-gray-400">Update your company's branding and appearance.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300">Business Name</label>
            <input type="text" name="businessName" id="businessName" defaultValue={tenant.businessName || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"/>
          </div>
          {/* Other business profile fields can go here */}
        </div>
      </div>

      {/* --- The Appearance section has been removed --- */}
      
      {/* API Keys Section */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-white">Shipping API Keys</h3>
          <p className="mt-1 text-sm text-gray-400">Enter your own API keys for shipping providers.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3"><label htmlFor="fardaExpressClientId" className="block text-sm font-medium text-gray-300">Farda Express Client ID</label><input type="text" name="fardaExpressClientId" id="fardaExpressClientId" defaultValue={tenant.fardaExpressClientId || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" /></div>
          <div className="sm:col-span-3"><label htmlFor="fardaExpressApiKey" className="block text-sm font-medium text-gray-300">Farda Express API Key</label><input type="password" name="fardaExpressApiKey" id="fardaExpressApiKey" defaultValue={tenant.fardaExpressApiKey || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" /></div>
          <div className="sm:col-span-3"><label htmlFor="transExpressUsername" className="block text-sm font-medium text-gray-300">Trans Express Username</label><input type="text" name="transExpressUsername" id="transExpressUsername" defaultValue={tenant.transExpressUsername || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" /></div>
          <div className="sm:col-span-3"><label htmlFor="transExpressPassword" className="block text-sm font-medium text-gray-300">Trans Express Password</label><input type="password" name="transExpressPassword" id="transExpressPassword" defaultValue={tenant.transExpressPassword || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" /></div>
          <div className="sm:col-span-6"><label htmlFor="royalExpressApiKey" className="block text-sm font-medium text-gray-300">Royal Express API Key</label><input type="password" name="royalExpressApiKey" id="royalExpressApiKey" defaultValue={tenant.royalExpressApiKey || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-700 text-white shadow-sm" /></div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end gap-x-3">
          {state?.status === 'error' && <p className="text-sm text-red-400 self-center">{state.message}</p>}
          {state?.status === 'success' && <p className="text-sm text-green-400 self-center">{state.message}</p>}
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}