// src/app/(superadmin)/superadmin/settings/change-password-form.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateSuperAdminPassword } from './actions';
import { useEffect, useRef } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50">
      {pending ? 'Saving...' : 'Save Password'}
    </button>
  );
}

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [state, dispatch] = useActionState(updateSuperAdminPassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.status === 'success') {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form action={dispatch} ref={formRef} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium leading-6 text-gray-200">Current Password</label>
        <input type="password" name="currentPassword" id="currentPassword" required className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-gray-200">New Password</label>
        <input type="password" name="newPassword" id="newPassword" required className="mt-2 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500" />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
      {state?.status === 'error' && <p className="text-sm text-red-400">{state.message || "An unknown error occurred."}</p>}
      {state?.status === 'success' && <p className="text-sm text-green-400">{state.message}</p>}
    </form>
  );
}