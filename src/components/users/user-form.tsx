'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Role } from '@prisma/client';

const permissionsList = [
    "VIEW_DASHBOARD", "VIEW_PRODUCTS", "EDIT_PRODUCTS", "DELETE_PRODUCTS",
    "EDIT_STOCK_LEVELS", "VIEW_LEADS", "CREATE_LEADS", "EDIT_LEADS", "DELETE_LEADS",
    "VIEW_ORDERS", "CREATE_ORDERS", "EDIT_ORDERS", "DELETE_ORDERS",
    "VIEW_SHIPPING", "UPDATE_SHIPPING_STATUS", "VIEW_REPORTS", "EXPORT_REPORTS",
    "MANAGE_USERS", "MANAGE_SETTINGS"
];

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(Role),
  password: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    permissions: string[];
}

interface UserFormProps {
  user: User | null; // null for creating, user object for editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, control, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || Role.TEAM_MEMBER,
      permissions: user?.permissions || [],
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true);
    const apiEndpoint = user ? `/api/users/${user.id}` : '/api/users';
    const method = user ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${user ? 'update' : 'create'} user.`);
      }

      toast.success(`User ${user ? 'updated' : 'created'} successfully!`);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-bold text-white">{user ? 'Edit User' : 'Add New User'}</h2>
      {/* Name and Email fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
          <input type="text" id="name" {...register('name')} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white" />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
          <input type="email" id="email" {...register('email')} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white" />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
        </div>
      </div>
      {/* Password field (only for new users) */}
      {!user && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
          <input type="password" id="password" {...register('password')} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white" />
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
        </div>
      )}
       {/* Role Selector */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
        <select id="role" {...register('role')} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md text-white">
          <option value={Role.ADMIN}>Admin</option>
          <option value={Role.TEAM_MEMBER}>Team Member</option>
        </select>
      </div>
      {/* Permissions Checkboxes */}
      <div>
        <label className="block text-sm font-medium text-gray-300">Permissions</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-48 overflow-y-auto p-2 bg-gray-900/50 rounded-md">
          {permissionsList.map(permission => (
            <div key={permission} className="flex items-center">
              <Controller
                name="permissions"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id={permission}
                    className="h-4 w-4 rounded"
                    checked={field.value?.includes(permission)}
                    onChange={(e) => {
                      const newPermissions = e.target.checked
                        ? [...(field.value || []), permission]
                        : (field.value || []).filter(p => p !== permission);
                      field.onChange(newPermissions);
                    }}
                  />
                )}
              />
              <label htmlFor={permission} className="ml-2 text-sm text-gray-300">{permission.replace(/_/g, ' ').toLowerCase()}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-500">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50">
          {isLoading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  );
}
