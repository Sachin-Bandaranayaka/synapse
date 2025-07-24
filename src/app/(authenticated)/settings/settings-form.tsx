// src/app/(authenticated)/settings/settings-form.tsx

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateTenantSettings } from './actions';
// --- FIX: Import ShippingProvider enum from Prisma client ---
import { Tenant, ShippingProvider } from '@prisma/client';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
      {pending ? 'Saving...' : 'Save Settings'}
    </button>
  );
}

export function SettingsForm({ tenant }: { tenant: Tenant }) {
  const [state, dispatch] = useActionState(updateTenantSettings, undefined);

  return (
    <form action={dispatch} className="space-y-8 divide-y divide-gray-700">
      {/* Business Profile Section */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg font-medium text-white">Business Profile</h3>
          <p className="mt-1 text-sm text-gray-400">Update your company's branding and invoice details.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300">Business Name</label>
            <input type="text" name="businessName" id="businessName" defaultValue={tenant.businessName || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"/>
          </div>

          <div className="sm:col-span-6">
              <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300">Business Address</label>
              <textarea name="businessAddress" id="businessAddress" rows={3} defaultValue={tenant.businessAddress || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"></textarea>
          </div>

          <div className="sm:col-span-3">
              <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-300">Business Phone</label>
              <input type="text" name="businessPhone" id="businessPhone" defaultValue={tenant.businessPhone || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"/>
          </div>
          <div className="sm:col-span-3">
              <label htmlFor="invoicePrefix" className="block text-sm font-medium text-gray-300">Invoice Prefix</label>
              <input type="text" name="invoicePrefix" id="invoicePrefix" defaultValue={tenant.invoicePrefix || ''} placeholder="e.g., INV-" className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm"/>
          </div>
        </div>
      </div>

      {/* --- NEW: Shipping Settings Section --- */}
      <div className="pt-8">
        <div>
            <h3 className="text-lg font-medium leading-6 text-white">Shipping Settings</h3>
            <p className="mt-1 text-sm text-gray-400">Configure your default shipping options.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
                <label htmlFor="defaultShippingProvider" className="block text-sm font-medium text-gray-300">Default Shipping Provider</label>
                <select
                    id="defaultShippingProvider"
                    name="defaultShippingProvider"
                    defaultValue={tenant.defaultShippingProvider || ''}
                    className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    {/* Map over the ShippingProvider enum to create options */}
                    {Object.values(ShippingProvider).map((provider) => (
                        <option key={provider} value={provider}>
                            {provider.replace('_', ' ')}
                        </option>
                    ))}
                </select>
            </div>
        </div>
      </div>
      
      {/* API Keys Section */}
      <div className="pt-8">
        <div>
          <h3 className="text-lg font-medium leading-6 text-white">Shipping API Keys</h3>
          <p className="mt-1 text-sm text-gray-400">Enter your own API keys for shipping providers.</p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="fardaExpressClientId" className="block text-sm font-medium text-gray-300">Farda Express Client ID</label>
            <p className="mt-1 text-xs text-gray-400">Your Farda Express client identifier</p>
            <input type="text" name="fardaExpressClientId" id="fardaExpressClientId" defaultValue={tenant.fardaExpressClientId || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="fardaExpressApiKey" className="block text-sm font-medium text-gray-300">Farda Express API Key</label>
            <p className="mt-1 text-xs text-gray-400">Your Farda Express API key</p>
            <input type="password" name="fardaExpressApiKey" id="fardaExpressApiKey" defaultValue={tenant.fardaExpressApiKey || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="transExpressApiKey" className="block text-sm font-medium text-gray-300">Trans Express API Key</label>
            <p className="mt-1 text-xs text-gray-400">Enter your single API key for Trans Express</p>
            <input type="password" name="transExpressApiKey" id="transExpressApiKey" defaultValue={tenant.transExpressApiKey || ''} className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" />
          </div>
          <div className="sm:col-span-6">
            <label htmlFor="royalExpressApiKey" className="block text-sm font-medium text-gray-300">Royal Express Credentials</label>
            <p className="mt-1 text-xs text-gray-400">Enter in format: email:password (e.g., user@example.com:yourpassword)</p>
            <input type="password" name="royalExpressApiKey" id="royalExpressApiKey" defaultValue={tenant.royalExpressApiKey || ''} placeholder="email:password" className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm" />
          </div>
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
